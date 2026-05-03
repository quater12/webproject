from django.contrib import admin

from .models import Cart, CartItem, Favorite, Lot, LotImage, Order, OrderItem, Profile, Review

admin.site.register(Profile)
admin.site.register(Lot)
admin.site.register(LotImage)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Favorite)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Review)
