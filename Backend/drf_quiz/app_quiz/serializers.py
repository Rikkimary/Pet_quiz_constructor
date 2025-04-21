from rest_framework import serializers
from .models import Quiz_title, Quiz_question, Quiz_question_answers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined')

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError('Пароли не совпадают!!')
        return attrs
    def create(self, validated_data):
        user = User.objects.create(username=validated_data['username'], email=validated_data['email'])
        user.set_password(validated_data['password'])
        user.save()
        return user


class QuizTitleSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    # author = serializers.SlugRelatedField(slug_field="username", queryset=User.objects.all())
    # created_at = serializers.DateField(format="%Y-%m-%d")
    class Meta:
        model = Quiz_title
        fields = ("id", "name_quiz", "title", "description", "image", "author", "created_at")

        print('created_at')

    def update(self, instance, validated_data):
        print("Updating with data:", validated_data)  # Логируем данные
        instance.name_quiz = validated_data.get('name_quiz', instance.name_quiz)
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)

        # Обновляем изображение, только если оно передано
        if 'image' in validated_data:
            instance.image = validated_data['image']

        instance.save()
        return instance

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)  # Генерация полного URL
        return None


class QuizQuestionSerializer(serializers.ModelSerializer):\

    class Meta:
        model = Quiz_question
        fields = ('id', 'question', 'image_quest')

    # Переопределяем метод create, чтобы добавлять связь с квизом программно, через 'quiz_id' из контекста
    def create(self, validated_data):
        # Получаем объект квиза из контекста
        quiz = validated_data.pop('quiz') # сработал именно этот вариат.
        # Т.к. в моем случае важно было забрать параметр quiz напрямую из запроса через передаваемые параметры. Иначе не работало
        if not quiz:
            raise serializers.ValidationError({"quiz": "Quiz is required in the context"})
        # Создаем вопрос, привязанный к квизу
        return Quiz_question.objects.create(quiz=quiz, **validated_data)

    def get_image_quest(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)  # Генерация полного URL
        return None

    def update(self, instance, validated_data):
        print("обновленные данные вопросов:", validated_data)  # Логируем данные
        instance.question = validated_data.get('question', instance.question)

        # Обновляем изображение, только если оно передано
        if 'image' in validated_data:
            instance.image = validated_data['image']

        instance.save()
        return instance

class QuizQuestionAnswersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz_question_answers
        fields = ['id', 'answer', 'is_correct']

    def update(self, instance, validated_data):
        print("обновленные данные вопросов:", validated_data)  # Логируем данные
        instance.answer = validated_data.get('answer', instance.answer)
        instance.is_correct = validated_data.get('is_correct', instance.is_correct)
        instance.save()
        return instance

class ContactInfoSerializer(serializers.Serializer):
    contactInfo = serializers.CharField(max_length=255)
    method = serializers.ChoiceField(choices=[('email', 'Email'), ('phone', 'Phone')])
    percentage = serializers.CharField(max_length=20)
    emailAuthor = serializers.CharField(max_length=255)


