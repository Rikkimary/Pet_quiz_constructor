from django.db.models.expressions import result
from django.template.context_processors import request
from rest_framework import viewsets, serializers, generics
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView
from django.utils import timezone

from .serializers import (QuizTitleSerializer, QuizQuestionSerializer, UserSerializer, UserRegistrationSerializer,
                          QuizQuestionAnswersSerializer, ContactInfoSerializer)
from .models import Quiz_title, Quiz_question, Quiz_question_answers
from django.contrib.auth.models import User
from  rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from django.core.mail import send_mail


class UserRegistrationView(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = response.data
        user_instance = User.objects.get(username=user['username'])
        refresh = RefreshToken.for_user(user_instance)
        return Response({
            'user': user,
            'refresh': str(refresh),
            'access': str(refresh.access_token), #возможно здесь просто token
        })

class LoginUserView(viewsets.ModelViewSet):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        # Проверяем, введены ли все необходимые данные
        if not username or not password:
            return Response({"detail": "Введите имя пользователя и пароль"}, status=status.HTTP_400_BAD_REQUEST)

        # Аутентификация пользователя
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Если аутентификация успешна, создаем JWT-токены
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            })
        else:
            return Response({"detail": "Неверные учетные данные"}, status=status.HTTP_401_UNAUTHORIZED)


class QuizTitleViewSet(viewsets.ModelViewSet):

    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = QuizTitleSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Quiz_title.objects.filter(author=self.request.user)
            # Если пользователь не авторизован, возвращаем все квизы
        return Quiz_title.objects.all()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"detail": "Квиз удален успешно"}, status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, *args, **kwargs):
        print("Received data:", request.data)  # Логируем текстовые данные
        print("Received files:", request.FILES)  # Логируем файлы
        instance = self.get_object()
        instance.created_at = timezone.now().date()

        # Объединяем request.data и request.FILES для передачи в сериализатор
        data = {
            'name_quiz': str(request.data.get('name_quiz', instance.name_quiz)),
            'title': str(request.data.get('title', instance.title)),
            'description': str(request.data.get('description', instance.description)),
        }

        # Добавляем файл, если он передан
        if 'image' in request.FILES:
            data['image'] = request.FILES['image']

        serializer = self.get_serializer(instance, data=data, partial=True)
        if not serializer.is_valid():
            print("Serializer errors:", serializer.errors)  # Логируем ошибки
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='details')
    def get_quiz_details(self, request, pk=None):
        questions = Quiz_question.objects.filter(quiz_id=pk)
        print(f"Found {questions.count()} questions for quiz ID {pk}")
        serializer = QuizQuestionSerializer(questions, many=True)
        return Response(serializer.data)

class QuizQuestionViewSet(viewsets.ModelViewSet):
    # permission_classes = [IsAuthenticated]
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Quiz_question.objects.all()
    serializer_class = QuizQuestionSerializer

    def get_queryset(self):
        # Отладка: Проверяем, есть ли quiz_id в URL
        print(f"Kwargs in get_queryset: {self.kwargs}")
        quiz = self.kwargs.get('quiztitle__pk')
        print(f"Kwargs in get_queryset: {self.kwargs}")
        print(f"Quiz ID from URL: {quiz}")  # Отладка
        if quiz== None:
            raise serializers.ValidationError({"quiz_id": "Quiz ID is missing in URL"})
        return Quiz_question.objects.filter(quiz=quiz)

    def perform_create(self, serializer):
        # Отладка: Проверяем, получаем ли правильный квиз
        print(f"Kwargs in perform_create: {self.kwargs}")
        quiz = get_object_or_404(Quiz_title, id=self.kwargs['quiztitle__pk'])
        print(f"Kwargs in perform_create: {self.kwargs}")
        print(f"Creating question for quiz: {quiz.id}")  # Отладка
        # Передаем объект квиза в сериализатор через контекст
        serializer.save(quiz=quiz)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"detail": "Вопрос удален успешно"}, status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, *args, **kwargs):

        print("Received data:",request.data)  # Логируем текстовые данные
        print("Received files:", request.FILES)  # Логируем файлы
        question = self.get_object()  # Получаем вопрос по ID

        # Объединяем request.data и request.FILES для передачи в сериализатор
        data = {
            'question': str(request.data.get('question', question.question)),
        }

        # Добавляем файл, если он передан
        if 'image_quest' in request.FILES:
            data['image_quest'] = request.FILES['image_quest']

        serializer = self.get_serializer(question, data=data, partial=True)
        if not serializer.is_valid():
            print("Serializer errors:", serializer.errors)  # Логируем ошибки
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class QuizQuestionAnswersViewSet(viewsets.ModelViewSet):
    # queryset = Quiz_question_answers.objects.all()
    serializer_class = QuizQuestionAnswersSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    # permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Получаем параметр question_pk из URL
        question_id = self.kwargs.get('question__pk')
        # Фильтруем ответы, относящиеся только к конкретному вопросу
        if question_id:
            return Quiz_question_answers.objects.filter(question_id=question_id)
        return Quiz_question_answers.objects.none()

    def create(self, request, *args, **kwargs):
        # Получаем данные из запроса
        question_id = self.kwargs.get('question__pk')
        question = get_object_or_404(Quiz_question, pk=question_id)
        answers = request.data.get('answers', [])  # Получаем массив ответов
        print(answers)
        if not answers:
            return Response({'detail': 'Список ответов пуст'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Создаем ответы в цикле
        created_answers = []
        for answer_data in answers:
            answer = Quiz_question_answers.objects.create(
                question=question,
                answer=answer_data['answer'],  # Извлекаем текст ответа
                is_correct=answer_data['is_correct']  # Извлекаем булевое значение
            )
            created_answers.append(answer)

        # Возвращаем список созданных ответов
        serializer = self.get_serializer(created_answers, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):

        print("Received data:",request.data)  # Логируем текстовые данные
        answer = self.get_object()  # Получаем вопрос по ID

        # Объединяем request.data и request.FILES для передачи в сериализатор
        data = {
            'answer': str(request.data.get('answer', answer.answer)),
            'is_correct': str(request.data.get('is_correct', answer.is_correct)),
        }

        serializer = self.get_serializer(answer, data=data, partial=True)
        if not serializer.is_valid():
            print("Serializer errors:", serializer.errors)  # Логируем ошибки
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({"detail": "Ответ удален успешно"}, status=status.HTTP_204_NO_CONTENT)

class CurrentUserView(APIView):
    permission_classes =[IsAuthenticated] #[permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'username': user.username,
        })


class ContactInfoView(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = ContactInfoSerializer

    def create(self, request,*args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        print(serializer)
        if serializer.is_valid():
            contact_info = serializer.validated_data['contactInfo']
            method = serializer.validated_data['method']
            result = serializer.validated_data['percentage']
            author_email = serializer.validated_data['emailAuthor']

            # Здесь укажите email автора теста
            # author_email = 'a.i.gorbylev@yandex.ru'

            # Формируем сообщение
            message = f'Пользователь оставил контактные данные:\n{method}: {contact_info}, его результат - {result}'
            send_mail('Сообщение:', message, 'gorbylev2009@gmail.com', [author_email])

            return Response({'message': 'Контактные данные успешно отправлены!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)