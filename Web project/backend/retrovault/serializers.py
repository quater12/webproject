from django.contrib.auth import get_user_model
from django.db.models import Avg
from rest_framework import serializers

from .models import Cart, CartItem, Favorite, Lot, LotImage, Order, OrderItem, Profile, Review

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES, default="buyer", write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name", "role")

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use.")
        return value

    def validate_username(self, value: str) -> str:
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already in use.")
        return value

    def validate_password(self, value: str) -> str:
        if not any(ch.isdigit() for ch in value):
            raise serializers.ValidationError("Password must include at least one digit.")
        return value

    def create(self, validated_data):
        role = validated_data.pop("role", "buyer")
        password = validated_data.pop("password")
        email = validated_data.get("email", "")
        username = validated_data.get("username")
        if not username:
            base = email.split("@")[0] or "user"
            candidate = base
            suffix = 1
            while User.objects.filter(username=candidate).exists():
                suffix += 1
                candidate = f"{base}{suffix}"
            validated_data["username"] = candidate
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Profile.objects.create(user=user, role=role, display_name=user.username)
        return user


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("role", "display_name", "phone", "rating", "deals_count")


class LotImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = LotImage
        fields = ("id", "image_url", "is_primary")


class SellerPublicSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    deals_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "rating", "deals_count")


    def get_rating(self, obj):
        return float(Review.objects.filter(seller=obj).aggregate(avg=Avg("rating"))["avg"] or 0)

    def get_deals_count(self, obj):
        return obj.order_sales.count()


class LotSerializer(serializers.ModelSerializer):
    seller = SellerPublicSerializer(read_only=True)
    images = LotImageSerializer(many=True, read_only=True)
    image_urls = serializers.ListField(
        child=serializers.URLField(max_length=500),
        write_only=True,
        required=False,
        min_length=1,
        max_length=5,
    )

    class Meta:
        model = Lot
        fields = (
            "id",
            "seller",
            "title",
            "description",
            "price_uah",
            "category",
            "decade",
            "condition",
            "status",
            "tags",
            "images",
            "image_urls",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("status",)

    def create(self, validated_data):
        image_urls = validated_data.pop("image_urls", [])
        lot = Lot.objects.create(**validated_data)
        for idx, image_url in enumerate(image_urls):
            LotImage.objects.create(lot=lot, image_url=image_url, is_primary=idx == 0)
        return lot


class LotCardSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    seller = SellerPublicSerializer(read_only=True)

    class Meta:
        model = Lot
        fields = ("id", "title", "price_uah", "category", "decade", "status", "primary_image", "seller")

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        return primary.image_url if primary else ""


class CartItemSerializer(serializers.ModelSerializer):
    lot = LotCardSerializer(read_only=True)
    lot_id = serializers.IntegerField(write_only=True, required=True, source="lot.id")

    class Meta:
        model = CartItem
        fields = ("id", "lot", "lot_id", "quantity", "added_at")
        read_only_fields = ("id", "added_at")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "user", "items", "total_amount", "created_at", "updated_at")
        read_only_fields = ("user",)

    def get_total_amount(self, obj):
        return float(sum(item.lot.price_uah * item.quantity for item in obj.items.select_related("lot")))


class CreateCartItemSerializer(serializers.Serializer):
    lot_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=1, default=1)


class OrderItemSerializer(serializers.ModelSerializer):
    lot = LotCardSerializer(read_only=True)
    seller = SellerPublicSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "lot", "seller", "unit_price", "quantity")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ("buyer", "status", "total_amount", "tracking_number")


class CheckoutSerializer(serializers.Serializer):
    recipient_full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    city = serializers.CharField(max_length=120)
    postal_operator = serializers.ChoiceField(choices=(("nova_poshta", "Nova Poshta"), ("ukrposhta", "Ukrposhta")))
    delivery_point = serializers.CharField(max_length=255)


class SellerShipmentSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=120, required=False, allow_blank=True)


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ("buyer", "seller")


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ("id", "lot", "created_at")
