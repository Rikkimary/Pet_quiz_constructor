# from rest_framework.routers import DefaultRouter Старый импорт пока комментирем
from django.urls import path, include
from rest_framework_nested import routers
from .views import QuizTitleViewSet, QuizQuestionViewSet, QuizQuestionAnswersViewSet

# Основной роутер для квизов
router = routers.DefaultRouter()
router.register(r'quiztitle', QuizTitleViewSet, basename='quiztitle')

# Вложенный роутер для вопросов, которые относятся к конкретному квизу
quiz_router = routers.NestedSimpleRouter(router, r'quiztitle', lookup='quiztitle')
quiz_router.register(r'questions', QuizQuestionViewSet, basename='questions')

# Вложенный роутер для ответов, относящихся к конкретному вопросу
question_router = routers.NestedSimpleRouter(quiz_router, r'questions', lookup='question')
question_router.register(r'answers', QuizQuestionAnswersViewSet, basename='answers')



urlpatterns = [
    path('', include(router.urls)),
    path('', include(quiz_router.urls)),
    path('', include(question_router.urls)),
]