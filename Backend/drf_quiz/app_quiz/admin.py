from django.contrib import admin
from .models import Quiz_title, Quiz_question

class QuizTitleAdmin(admin.ModelAdmin):
    pass

class QuizQuestionAdmin(admin.ModelAdmin):
    pass

# Регистрируем модели отдельно
admin.site.register(Quiz_title, QuizTitleAdmin)
admin.site.register(Quiz_question, QuizQuestionAdmin)

