from django.db import models
from django.utils import timezone
from datetime import date
from django.contrib.auth.models import User
import os
from django.conf import settings

def quiz_image_upload_path_for_quiz(quiz, filename):
    # Если объект ещё не сохранён, используем временную папку
    if not quiz.id:
        return os.path.join('quizzes', 'temp', filename)
    # После сохранения используем папку с id
    return os.path.join('quizzes', str(quiz.id), filename)

def quiz_image_upload_path_for_question(question, filename):
    # Если объект ещё не сохранён, используем временную папку
    if not question.id:
        return os.path.join('quizzes', 'temp', filename)
    # После сохранения используем папку с id
    return os.path.join('quizzes', str(question.quiz_id), str(question.id), filename)

class Quiz_title(models.Model):
    name_quiz = models.CharField(max_length=200) #Общее название квиза
    title = models.CharField(max_length=200) #Заглавие, подназвание, можно слоган
    description = models.TextField(max_length=400) #Общее описание, что будем проходить
    image = models.ImageField(upload_to=quiz_image_upload_path_for_quiz, blank=True, null=True)  # Поле для изображения
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateField(default=date.today)

    def save(self, *args, **kwargs):
        # Проверяем, нужно ли пересохранить файл
        if not self.id:
            # Сохраняем объект в первый раз для получения ID
            super().save(*args, **kwargs)
            # Если файл изображения загружен, переместим его в новую папку
            if self.image:
                old_image_path = self.image.path  # Старый путь
                new_image_path = quiz_image_upload_path_for_quiz(self, os.path.basename(self.image.name))
                self.image.name = new_image_path
                super().save(update_fields=["image"])  # Сохраняем путь к файлу
                # Перемещаем файл вручную
                os.makedirs(os.path.dirname(self.image.path), exist_ok=True)
                os.rename(old_image_path, self.image.path)

                # Удаляем временный файл, если он существует
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
        else:
            # Если объект уже имеет ID, сохраняем его стандартно
            super().save(*args, **kwargs)



    def __str__(self): #Пока понимаю, что это отображение в Django, если нужна доп инфо, то добавляем
        return self.title

class Quiz_question(models.Model):
    quiz = models.ForeignKey(Quiz_title, on_delete=models.CASCADE, related_name='questions')  # Связь с квизом
    question = models.CharField(max_length=200) #Название вопроса
    image_quest = models.ImageField(upload_to=quiz_image_upload_path_for_question, blank=True, null=True)

    def save(self, *args, **kwargs):
        # Проверяем, нужно ли пересохранить файл
        if not self.id:
            # Сохраняем объект в первый раз для получения ID
            super().save(*args, **kwargs)
            # Если файл изображения загружен, переместим его в новую папку
            if self.image_quest:
                old_image_path = self.image_quest.path  # Старый путь
                new_image_path = quiz_image_upload_path_for_question(self, os.path.basename(self.image_quest.name))
                self.image_quest.name = new_image_path
                super().save(update_fields=["image_quest"])  # Сохраняем путь к файлу
                # Перемещаем файл вручную
                os.makedirs(os.path.dirname(self.image_quest.path), exist_ok=True)
                os.rename(old_image_path, self.image_quest.path)

                # Удаляем временный файл, если он существует
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
        else:
            # Если объект уже имеет ID, сохраняем его стандартно
            super().save(*args, **kwargs)

    def __str__(self): #Пока понимаю, что это отображение в Django, если нужна доп инфо, то добавляем
        return self.question

class Quiz_question_answers(models.Model):
    question = models.ForeignKey(Quiz_question, on_delete=models.CASCADE, related_name='answers')  # Связь с вопросом
    answer = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)
    # is_correct = models.BooleanField(default=False)  # Добавляем флаг правильного ответа
    #
    # def __str__(self):
    #     return self.answer




