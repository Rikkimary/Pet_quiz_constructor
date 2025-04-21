"""
URL configuration for drf_quiz project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from app_quiz.views import LoginUserView, UserRegistrationView, CurrentUserView, ContactInfoView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include('app_quiz.urls')),
    path("api/token/", TokenObtainPairView.as_view(), name="token"),
    path("api/refresh_token/", TokenRefreshView.as_view(), name="refresh_token"),
    path("api/register/", UserRegistrationView.as_view({'post': 'create'}), name="register"),  # Новый маршрут для регистрации
    path("api/login/", LoginUserView.as_view({'post': 'create'}), name="login"),  # Новый маршрут для логина
    path('api/current_user/', CurrentUserView.as_view(), name='current_user'),
    path("api/contact/", ContactInfoView.as_view({'post': 'create'}), name="contact_info"),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

