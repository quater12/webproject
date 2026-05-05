from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView
from retrovault.views import EmailTokenObtainAPIView, GoogleOAuthAPIView, RegisterAPIView

urlpatterns = [
    path("", RedirectView.as_view(url="http://localhost:5173/", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/register/", RegisterAPIView.as_view(), name="register"),
    path("api/auth/token/", EmailTokenObtainAPIView.as_view(), name="token_obtain_pair"),
    path("api/auth/oauth/google/", GoogleOAuthAPIView.as_view(), name="google_oauth"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("retrovault.urls")),
]
