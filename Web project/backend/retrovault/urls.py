from rest_framework.routers import DefaultRouter

from django.urls import path

from .views import (
    CartAPIView,
    CheckoutAPIView,
    FavoriteAPIView,
    LotViewSet,
    LogoutAPIView,
    OrderViewSet,
    ReviewAPIView,
    SellerPageAPIView,
)

router = DefaultRouter()
router.register(r"orders", OrderViewSet, basename="order")
router.register(r"lots", LotViewSet, basename="lot")

urlpatterns = [
    path("auth/logout/", LogoutAPIView.as_view(), name="logout"),
    path("cart/", CartAPIView.as_view(), name="cart"),
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("reviews/", ReviewAPIView.as_view(), name="reviews"),
    path("favorites/", FavoriteAPIView.as_view(), name="favorites"),
    path("sellers/<int:seller_id>/", SellerPageAPIView.as_view(), name="seller-page"),
]

urlpatterns += router.urls
