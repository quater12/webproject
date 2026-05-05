from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Avg, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Cart, CartItem, Favorite, Lot, Order, OrderItem, Profile, Review
from .pagination import LotPagination
from .serializers import (
    CartSerializer,
    CheckoutSerializer,
    CreateCartItemSerializer,
    FavoriteSerializer,
    LotCardSerializer,
    LotSerializer,
    OrderSerializer,
    RegisterSerializer,
    ReviewSerializer,
    SellerPublicSerializer,
    SellerShipmentSerializer,
)

User = get_user_model()


def is_seller(user) -> bool:
    return hasattr(user, "profile") and user.profile.role == "seller"


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.profile.role,
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        auth_header = request.headers.get("Authorization", "")
        refresh_token = request.data.get("refresh")
        if not refresh_token and auth_header.lower().startswith("bearer "):
            refresh_token = auth_header.split(" ", 1)[1]
        if not refresh_token:
            return Response({"detail": "refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "invalid or already blacklisted token"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({"success": True}, status=status.HTTP_200_OK)


class EmailTokenObtainAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        auth_user = authenticate(request=request, username=user.username, password=password)
        if not auth_user:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(auth_user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": auth_user.id,
                    "username": auth_user.username,
                    "email": auth_user.email,
                    "role": auth_user.profile.role if hasattr(auth_user, "profile") else "buyer",
                },
            }
        )


class GoogleOAuthAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Dev-mode OAuth stub: accepts oauth_token + email and issues JWT.
        oauth_token = request.data.get("oauth_token", "")
        email = request.data.get("email", "").strip().lower()
        if not oauth_token or not email:
            return Response({"detail": "oauth_token and email are required"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            username = email.split("@")[0]
            suffix = 1
            unique_username = username
            while User.objects.filter(username=unique_username).exists():
                suffix += 1
                unique_username = f"{username}{suffix}"
            user = User.objects.create(username=unique_username, email=email)
            user.set_unusable_password()
            user.save()
            Profile.objects.create(user=user, role=request.data.get("role", "buyer"), display_name=user.username)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.profile.role if hasattr(user, "profile") else "buyer",
                },
            }
        )


class LotViewSet(viewsets.ModelViewSet):
    serializer_class = LotSerializer
    pagination_class = LotPagination

    def get_permissions(self):
        if self.action in ["list", "retrieve", "search"]:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Lot.objects.select_related("seller").prefetch_related("images").all()
        params = self.request.query_params

        if self.action in ["list", "search"]:
            queryset = queryset.filter(status="active")

        category = params.get("category")
        decade = params.get("decade")
        price_min = params.get("price_min")
        price_max = params.get("price_max")
        sort = params.get("sort", "newest")
        seller_id = params.get("seller_id")

        if category:
            queryset = queryset.filter(category=category)
        if decade:
            queryset = queryset.filter(decade=decade)
        if seller_id:
            queryset = queryset.filter(seller_id=seller_id)
        if price_min:
            queryset = queryset.filter(price_uah__gte=price_min)
        if price_max:
            queryset = queryset.filter(price_uah__lte=price_max)

        if sort == "price_asc":
            queryset = queryset.order_by("price_uah")
        elif sort == "price_desc":
            queryset = queryset.order_by("-price_uah")
        else:
            queryset = queryset.order_by("-created_at")
        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return LotCardSerializer
        return LotSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user, status="active")

    def perform_update(self, serializer):
        if serializer.instance.seller_id != self.request.user.id:
            raise PermissionDenied("You can edit only your own lots.")
        serializer.save()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status == "archived":
            return Response({"detail": "Lot not found."}, status=status.HTTP_404_NOT_FOUND)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["patch"])
    def archive(self, request, pk=None):
        lot = self.get_object()
        if lot.seller_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        lot.status = "archived"
        lot.save(update_fields=["status", "updated_at"])
        return Response({"success": True, "status": lot.status})

    @action(detail=False, methods=["get"])
    def search(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response({"detail": "q must be at least 2 characters."}, status=status.HTTP_400_BAD_REQUEST)
        queryset = self.get_queryset().filter(Q(title__icontains=query) | Q(tags__icontains=query))
        page = self.paginate_queryset(queryset)
        serializer = LotCardSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class CartAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        payload = CreateCartItemSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        cart, _ = Cart.objects.get_or_create(user=request.user)
        lot = Lot.objects.filter(id=payload.validated_data["lot_id"]).first()
        if not lot:
            return Response({"detail": "Lot not found."}, status=status.HTTP_404_NOT_FOUND)
        if lot.status == "sold":
            return Response({"detail": "Lot already sold."}, status=status.HTTP_409_CONFLICT)
        if lot.seller_id == request.user.id:
            return Response({"detail": "Cannot buy your own lot."}, status=status.HTTP_403_FORBIDDEN)
        CartItem.objects.get_or_create(cart=cart, lot=lot, defaults={"quantity": 1})
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    def delete(self, request):
        lot_id = request.query_params.get("lot_id")
        if not lot_id:
            return Response({"detail": "lot_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        cart, _ = Cart.objects.get_or_create(user=request.user)
        CartItem.objects.filter(cart=cart, lot_id=lot_id).delete()
        return Response(CartSerializer(cart).data)


class CheckoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_items = list(cart.items.select_related("lot"))
        if not cart_items:
            return Response({"detail": "Cart is empty."}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        total = 0
        for item in cart_items:
            if item.lot.status == "sold":
                return Response(
                    {"detail": f"Lot {item.lot_id} already sold."},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )
            total += item.lot.price_uah * item.quantity

        order = Order.objects.create(
            buyer=request.user,
            total_amount=total,
            **serializer.validated_data,
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                lot=item.lot,
                seller=item.lot.seller,
                unit_price=item.lot.price_uah,
                quantity=item.quantity,
            )
            item.lot.status = "reserved"
            item.lot.save(update_fields=["status", "updated_at"])

        seller_emails = sorted({item.seller.email for item in order.items.select_related("seller") if item.seller.email})
        if seller_emails:
            send_mail(
                subject=f"RetroVault: New order #{order.id}",
                message=f"New order #{order.id} is created and contains your lot(s).",
                from_email="noreply@retrovault.local",
                recipient_list=seller_emails,
                fail_silently=True,
            )

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.prefetch_related("items__lot", "items__seller").filter(buyer=self.request.user).order_by(
            "-created_at"
        )

    @action(detail=True, methods=["patch"])
    def ship(self, request, pk=None):
        order = Order.objects.prefetch_related("items").filter(id=pk).first()
        if not order:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        seller_ids = {item.seller_id for item in order.items.all()}
        if request.user.id not in seller_ids:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        payload = SellerShipmentSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        order.status = "shipped"
        order.tracking_number = payload.validated_data.get("tracking_number", "")
        order.save(update_fields=["status", "tracking_number", "updated_at"])
        if order.buyer.email:
            send_mail(
                subject=f"RetroVault: Order #{order.id} shipped",
                message=f"Your order #{order.id} has been shipped. Tracking: {order.tracking_number or 'N/A'}",
                from_email="noreply@retrovault.local",
                recipient_list=[order.buyer.email],
                fail_silently=True,
            )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["patch"])
    def complete(self, request, pk=None):
        order = self.get_object()
        if order.buyer_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        order.status = "completed"
        order.save(update_fields=["status", "updated_at"])
        for item in order.items.select_related("lot").all():
            item.lot.status = "sold"
            item.lot.save(update_fields=["status", "updated_at"])
        return Response(OrderSerializer(order).data)


class ReviewAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = Order.objects.prefetch_related("items").filter(id=serializer.validated_data["order"].id).first()
        if not order:
            return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        if order.buyer_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        if order.status != "completed":
            return Response({"detail": "Order is not completed."}, status=status.HTTP_403_FORBIDDEN)
        if hasattr(order, "review"):
            return Response({"detail": "Review already exists."}, status=status.HTTP_409_CONFLICT)

        first_item = order.items.first()
        if not first_item:
            return Response({"detail": "Order has no items."}, status=status.HTTP_400_BAD_REQUEST)
        review = serializer.save(buyer=request.user, seller=first_item.seller)

        profile, _ = Profile.objects.get_or_create(user=review.seller)
        profile.rating = Review.objects.filter(seller=review.seller).aggregate(avg=Avg("rating"))["avg"] or 0
        profile.deals_count = review.seller.order_sales.count()
        profile.save(update_fields=["rating", "deals_count"])
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class FavoriteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Favorite.objects.filter(user=request.user).select_related("lot")
        return Response(FavoriteSerializer(queryset, many=True).data)

    def post(self, request):
        lot_id = request.data.get("lot_id")
        action_name = request.data.get("action")
        lot = Lot.objects.filter(id=lot_id).first()
        if not lot:
            return Response({"detail": "Lot not found"}, status=status.HTTP_404_NOT_FOUND)
        if action_name == "add":
            Favorite.objects.get_or_create(user=request.user, lot=lot)
        elif action_name == "remove":
            Favorite.objects.filter(user=request.user, lot=lot).delete()
        else:
            return Response({"detail": "action must be add/remove"}, status=status.HTTP_400_BAD_REQUEST)
        queryset = Favorite.objects.filter(user=request.user).select_related("lot")
        return Response(FavoriteSerializer(queryset, many=True).data)


class SellerPageAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    pagination_class = LotPagination

    def get(self, request, seller_id):
        seller = User.objects.filter(id=seller_id, is_active=True).first()
        if not seller:
            return Response({"detail": "Seller not found"}, status=status.HTTP_404_NOT_FOUND)
        seller_data = SellerPublicSerializer(seller).data
        lots = Lot.objects.filter(seller=seller, status="active").order_by("-created_at")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(lots, request)
        lots_data = LotCardSerializer(page, many=True).data
        paginated = paginator.get_paginated_response(lots_data).data
        return Response({"seller": seller_data, "lots": paginated})
