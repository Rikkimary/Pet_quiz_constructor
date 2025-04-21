document.addEventListener('DOMContentLoaded', async () => {
    const welcomeMessage = document.getElementById('welcome-message');
    const mainContent = document.getElementById('main-content');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const quizzesContainer = document.getElementById('quizzes-container');
    const quizzesCreateContainer = document.getElementById('quizzes-create-container')
    const quizzesShowAllContainer = document.getElementById('showAll-quizzes-container')
    const header = document.getElementById('header');
    const createQuizzesForm = document.getElementById('createQuizzes-form');
    const createQuizzesQuestionsForm = document.getElementById('createQuizzesQuestions-form');
    const createQuizzesQuestionsAnswersForm = document.getElementById('createQuizzesQuestionsAnswers-form');
    const submitAppendQuestionForm = document.getElementById('submitAppendQuestion-form');
    const messageElement = document.getElementById('messageElement');
    const editQuizContainer = document.getElementById('edit-quiz');
    const formTemplate = document.getElementById('edit-quizQuestionAnswer-form');

    const accessToken = localStorage.getItem('access');
    if (accessToken) {
        welcomeMessage.textContent = 'Добро пожаловать!';
        getCurrentUser().then(user => {
            welcomeMessage.textContent = `Вы авторизованы как ${user}`;
        }).catch(error => {
            console.error("Ошибка при получении текущего пользователя:", error);
        });
        header.querySelector('#auth-buttons').style.display = 'none';
        mainContent.style.display = 'block';
        document.getElementById('logoutButton').style.display = 'block';
        await createQuizzes(); //вызов функции создания квизов
        await loadAllQuizzes();
        quizzesContainer.style.display = 'block';
        const loadPersonalQuizzesButton = document.createElement('button');
        loadPersonalQuizzesButton.textContent = 'Показать мои квизы';
        loadPersonalQuizzesButton.classList.add('loadPersonal-button');
        loadPersonalQuizzesButton.addEventListener('click', async () => {
            await loadQuizzes();// Загрузка квизов;
        });
        quizzesContainer.appendChild(loadPersonalQuizzesButton);
    } else {
        registerForm.style.display = 'none';
        loginForm.style.display = 'none';
        mainContent.style.display = 'block';
        quizzesContainer.style.display = 'none';
        await loadAllQuizzes();
        document.getElementById('logoutButton').style.display = 'none';
    }

    document.getElementById("registerButton").addEventListener("click", () => {
        registerForm.style.display = "block";
        loginForm.style.display = "none";
    });

    document.getElementById("loginButton").addEventListener("click", () => {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('username', document.getElementById('username').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('password', document.getElementById('password').value);
        formData.append('password2', document.getElementById('password2').value);
        console.log("Data being sent: ", JSON.stringify(Object.fromEntries(formData)));
        const response = await fetch('http://localhost:8000/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData)),
        })

        const messageDiv = document.getElementById("register-message");
        if (response.ok) {
            messageDiv.textContent = 'Поздравляю! Вы зарегистрированы.';
            registerForm.reset();
            registerForm.style.display = "none";
            loginForm.style.display = "block";
        } else {
            messageDiv.textContent = 'Ошибка регистрации';
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        const response = await fetch('http://localhost:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password}),
        });

        const messageDiv = document.getElementById("login-message");
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);
            welcomeMessage.textContent = `Вы авторизованы как ${username}`;
            loginForm.style.display = "none";
            registerForm.style.display = "none";
            header.querySelector('#auth-buttons').style.display = 'none';
            document.getElementById('logoutButton').style.display = 'block';
            await createQuizzes();
            await loadAllQuizzes();
            quizzesContainer.style.display = 'block';
            const loadPersonalQuizzesButton = document.createElement('button');
            loadPersonalQuizzesButton.textContent = 'Показать мои квизы';
            loadPersonalQuizzesButton.classList.add('loadPersonal-button');
            loadPersonalQuizzesButton.addEventListener('click', async () => {
                await loadQuizzes();// Загрузка квизов;
            });
            quizzesContainer.appendChild(loadPersonalQuizzesButton);
        } else {
            messageDiv.textContent = 'Ошибка авторизации';
        }
    });
    async function loadAllQuizzes(){
        quizzesShowAllContainer.innerHTML = '<h2>Список квизов сайта</h2>';
        messageElement.innerText = "Для доступа к функциям создания квизов, просим Вас пройти регистрацию и авторизацию!!" +
            " С уважением, Администрация сайта.";
        const responseAll = await fetch('http://localhost:8000/api/quiztitle/', {
            method: "GET",
        });
        if (responseAll.ok) {
            const quizzesAll = await responseAll.json();
             if (quizzesAll.length === 0) {
                messageElement.innerText = "Квизы на ресурсе еще никем не созданы";
                messageElement.style.display = 'block';
                quizzesShowAllContainer.style.display = 'none';
            } else {
                messageElement.style.display = 'block';
                quizzesShowAllContainer.style.display = 'block';
                quizzesShowAllContainer.style.display = 'flex';
                quizzesShowAllContainer.style.flexWrap = 'wrap';
                quizzesAll.forEach(quiz => {
                    const quizElement = document.createElement('div');
                    quizElement.classList.add('showAll-quizzes');
                         // Название квиза
                    const quizTitle = document.createElement('h3');
                    quizTitle.textContent = quiz.name_quiz;

                    // Описание квиза
                    const quizDescription = document.createElement('p');
                    quizDescription.textContent = quiz.description;

                    const quizAuthor = document.createElement('p');
                    quizAuthor.textContent = 'Автор:  '+ quiz.author.username;

                    // Загрузка картинки квиза
                    const quizImage = document.createElement('img');
                    quizImage.src = quiz.image;
                    quizImage.style.width = '200px'; // Устанавливаем размеры (по желанию)
                    quizImage.style.height = 'auto'; // Сохраняем пропорции
                    quizImage.style.border = '1px solid red'; // Добавляем рамку, чтобы видеть область изображения

                    const startQuizButton = document.createElement('button');
                    startQuizButton.textContent = 'Пройти квиз';
                    startQuizButton.classList.add('start-button');
                    startQuizButton.style.color='blue';
                    startQuizButton.addEventListener('click', async () => {
                        await startQuiz(quiz);
                        quizzesShowAllContainer.innerHTML = '';
                        quizzesShowAllContainer.style.display = 'none';
                        quizzesContainer.style.display = 'block';
                    });
                        // Добавляем элементы в DOM
                    quizElement.appendChild(quizTitle);
                    quizElement.appendChild(quizDescription);
                    quizElement.appendChild(quizImage);
                    quizElement.appendChild(quizAuthor);
                    quizElement.appendChild(startQuizButton);

                    quizzesShowAllContainer.appendChild(quizElement);
                });
            }
        }

    }
    async function loadQuizzes() {
        quizzesContainer.innerHTML = '';
        quizzesContainer.innerHTML = '<h2>Список Ваших квизов</h2>';
        const response = await fetch('http://localhost:8000/api/quiztitle/', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access')}`,
            },
        });

        if (response.ok) {
            const quizzes = await response.json();
            const currentUser = await getCurrentUser(); // Получаем текущего пользователя
            const userQuizzes = quizzes.filter(quiz => quiz.author.username === currentUser); // Фильтруем по автору
            if (userQuizzes.length === 0) {
                messageElement.innerText = "Вами квизы еще не созданы";
                messageElement.style.display = 'block';
                quizzesContainer.style.display = 'none';
            } else {
                messageElement.style.display = 'none';
                quizzesContainer.style.display = 'block';
                quizzesContainer.style.display = 'flex';
                quizzesContainer.style.flexWrap = 'wrap';
                userQuizzes.forEach(quiz => {
                    const quizElement = document.createElement('div');
                    quizElement.classList.add('quiz-item');
                         // Название квиза
                    const quizTitle = document.createElement('h3');
                    quizTitle.textContent = quiz.name_quiz;

                    // Описание квиза
                    const quizDescription = document.createElement('p');
                    quizDescription.textContent = quiz.description;

                    // Загрузка картинки квиза
                    console.log(quiz.image);
                    const quizImage = document.createElement('img');
                    quizImage.src = quiz.image;
                    quizImage.style.width = '200px'; // Устанавливаем размеры (по желанию)
                    quizImage.style.height = 'auto'; // Сохраняем пропорции
                    quizImage.style.border = '1px solid red'; // Добавляем рамку, чтобы видеть область изображения

                    // Добавляем кнопку удаления
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Удалить';
                    deleteButton.classList.add('delete-button');
                    deleteButton.addEventListener('click', async () => {
                        if (confirm(`Вы уверены, что хотите удалить квиз "${quiz.name_quiz}"?`)) {
                            const quizId =quiz.id
                            await deleteQuiz(quizId);
                        }
                    });
                        // Кнопка просмотра
                    const viewButton = document.createElement('button');
                    viewButton.textContent = 'Просмотр';
                    viewButton.classList.add('view-button');
                    viewButton.addEventListener('click', async () => {
                        await viewQuiz(quiz.id, quiz.name_quiz);
                    });
                    // Кнопка просмотра
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Редактировать';
                    editButton.classList.add('edit-button');
                    editButton.addEventListener('click', async () => {
                        await editQuiz(quiz.id);
                        quizzesShowAllContainer.style.display = 'none';
                    });
                    const startQuizButton = document.createElement('button');
                    startQuizButton.textContent = 'Пройти квиз';
                    startQuizButton.classList.add('start-button');
                    startQuizButton.style.color='blue';
                    startQuizButton.addEventListener('click', async () => {
                        await startQuiz(quiz);
                    });

                        // Добавляем элементы в DOM
                    quizElement.appendChild(quizTitle);
                    quizElement.appendChild(quizDescription);
                    quizElement.appendChild(quizImage);
                    quizElement.appendChild(deleteButton);
                    quizElement.appendChild(viewButton);
                    quizElement.appendChild(editButton);
                    quizElement.appendChild(startQuizButton);

                    quizzesContainer.appendChild(quizElement);

                });
                const closeQuizButton = document.createElement('button');
                closeQuizButton.textContent = 'Скрыть мои квизы';
                closeQuizButton.classList.add('close-button');
                closeQuizButton.style.color='green';
                closeQuizButton.addEventListener('click', async () => {
                    quizzesContainer.innerHTML = '';
                    const loadPersonalQuizzesButton = document.createElement('button');
                    loadPersonalQuizzesButton.textContent = 'Показать мои квизы';
                    loadPersonalQuizzesButton.classList.add('loadPersonal-button');
                    loadPersonalQuizzesButton.addEventListener('click', async () => {
                        await loadQuizzes();// Загрузка квизов;
            });
            quizzesContainer.appendChild(loadPersonalQuizzesButton);

                });
                quizzesContainer.appendChild(closeQuizButton);
            }
        } else {
            console.error('Ошибка при загрузке квизов:', response.statusText);
        }
    }

    // Удаление квиза
    async function deleteQuiz(quizId) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("access")}`
                }
            });
            if (response.ok) {
                alert("Квиз удален успешно");
                await loadQuizzes(); // Перезагрузка списка квизов
            }
        } catch (error) {
            console.error("Ошибка при удалении квиза:", error);
        }
    }
    async function viewQuiz(quizId, quizName) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/details/`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`,
                },
            });

            if (response.ok) {
                const quizDetails = await response.json();
                console.log(quizDetails);

                // Очищаем контейнер и добавляем детали квиза
                quizzesContainer.innerHTML = '';
                const baseUrl = 'http://127.0.0.1:8000';
                quizDetails.forEach(question => {
                    const quizDetail = document.createElement('div');
                    quizDetail.classList.add('quiz-details');
                    const quizTitle = document.createElement('h2');
                    quizTitle.textContent = quizName;
                    const questionItem = document.createElement('li');
                    questionItem.textContent = question.question;
                    // Загрузка картинки квиза
                    console.log(question.image_quest); // Проверка какой URL генерируется
                    const questionImage = document.createElement('img');
                    questionImage.src = `${baseUrl}${question.image_quest}`;
                    questionImage.style.width = '200px'; // Устанавливаем размеры (по желанию)
                    questionImage.style.height = 'auto'; // Сохраняем пропорции
                    questionImage.style.border = '1px solid red'; // рамка, чтобы видеть область изображения

                    // Кнопка "Удалить вопрос"
                    const deleteQuestionButton = document.createElement('button');
                    deleteQuestionButton.textContent = 'Удалить вопрос';
                    deleteQuestionButton.addEventListener('click', async () => {
                        await deleteQuestion(question.id, quizId);
                    });

                    // Кнопка "Просмотр ответов"
                    const viewAnswersButton = document.createElement('button');
                    viewAnswersButton.textContent = 'Просмотр ответов';
                    viewAnswersButton.addEventListener('click', async () => {
                        await viewAnswers(question.id, quizName, question.question, quizId);
                    });

                    quizDetail.appendChild(quizTitle);
                    quizDetail.appendChild(questionItem);
                    quizDetail.appendChild(questionImage);
                    quizDetail.appendChild(deleteQuestionButton)
                    quizDetail.appendChild(viewAnswersButton)
                    // Добавляем элементы в DOM
                    quizzesContainer.appendChild(quizDetail);
                });

                // Кнопка "Просмотр ответов"
                const backToQuizzesButton = document.createElement('button');
                backToQuizzesButton.textContent = 'Назад к списку квизов';
                backToQuizzesButton.addEventListener('click', async () => {
                    await loadQuizzes();
                });
                quizzesContainer.appendChild(backToQuizzesButton);
            } else {
                throw new Error('Ошибка при загрузке деталей квиза');
            }
        } catch (error) {
            console.error(error.message);
        }
    }

    async function deleteQuestion(questionId, quizId) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/question/${questionId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`,
                },
            });

            if (response.ok) {
                alert('Вопрос успешно удален');
                // Обновляем список вопросов
                await viewQuiz(quizId);
            } else {
                throw new Error('Ошибка при удалении вопроса');
            }
        } catch (error) {
            console.error(error.message);
        }
    }

    async function viewAnswers(questionId, quizName, question, quizId) {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/questions/${questionId}/answers/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`,
                },
            });

            if (response.ok) {
                const answers = await response.json();
                console.log(answers);

                // Очищаем контейнер и добавляем детали квиза
                quizzesContainer.innerHTML = '';
                const quizNameForAnswerList = document.createElement('h2');
                quizNameForAnswerList.textContent = quizName;
                const questionNameForAnswerList = document.createElement('h3');
                questionNameForAnswerList.textContent = question;
                quizzesContainer.appendChild(quizNameForAnswerList);
                quizzesContainer.appendChild(questionNameForAnswerList);
                answers.forEach(answer => {
                    const answerList = document.createElement('div');
                    answerList.classList.add('question-details');
                    const answersItem = document.createElement('li');
                    answersItem.textContent = answer.answer;

                    // Кнопка "Удалить вопрос"
                    const deleteAnswerButton = document.createElement('button');
                    deleteAnswerButton.textContent = 'Удалить ответ';
                    deleteAnswerButton.addEventListener('click', async () => {
                        await deleteAnswer(answer.id, questionId, quizId);
                    });
                    answerList.appendChild(answersItem)
                    answerList.appendChild(deleteAnswerButton)
                    // Добавляем элементы в DOM
                     quizzesContainer.appendChild(answerList);
                });

                // Кнопка "Просмотр ответов"
                const backToQuestionButton = document.createElement('button');
                backToQuestionButton.textContent = 'Назад к списку вопросов';
                backToQuestionButton.addEventListener('click', async () => {
                    await viewQuiz(quizId, quizName);
                });
                quizzesContainer.appendChild(backToQuestionButton);
            } else {
                throw new Error('Ошибка при загрузке ответов');
            }
        } catch (error) {
            console.error(error.message);
        }
    }

    async function createQuizzes(){
        quizzesCreateContainer.style.display = 'block';
        document.getElementById('createQuiz-message').textContent = ''; // Сбрасываем сообщение
        document.getElementById("createQuizzes").addEventListener("click", () => {
            createQuizzesForm.style.display = "block";
        });

        createQuizzesForm.addEventListener('submit', async function(event) {
            event.preventDefault(); //блокировка пустой формы

            const formData = new FormData();
            formData.append('name_quiz', document.getElementById('name_quiz').value);
            formData.append('title', document.getElementById('title').value);
            formData.append('description', document.getElementById('description').value);
            formData.append('image', document.getElementById('image').files[0]);
            console.log(formData)
            // try {
            //     const authorUsername =  await getCurrentUser();
            //     formData.append('author', authorUsername);
            // } catch (error) {
            //     document.getElementById('register-message').textContent = error.message;
            //     return;
            // }
            console.log("Form Data: ", Array.from(formData.entries()));
            try {
                const response = await fetch('http://127.0.0.1:8000/api/quiztitle/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access')}`
                    }
                });

                if (response.ok) {
                    const quiz = await response.json(); // Получите данные квиза
                    document.getElementById('createQuiz-message').textContent =
                        'Квиз успешно создан! Теперь добавьте вопросы к созданному квизу';
                    createQuizzesForm.style.display = "none";
                    createQuizzesForm.reset();
                    await createQuizzesQuestions (quiz.id)
                    return quiz
                } else {
                    throw new Error('Ошибка при создании квиза');
                }
            } catch (error) {
                document.getElementById('createQuiz-message').textContent = error.message;
            }
        });

    }

    let quizzesQuestionsSubmitHandler= null;
    async function createQuizzesQuestions(quizId) {
        createQuizzesQuestionsForm.style.display = "block";
        document.getElementById('createQuizzesQuestions-message').textContent = '';
        // Удаляем предыдущий обработчик, если он существует
        createQuizzesQuestionsForm.removeEventListener('submit', quizzesQuestionsSubmitHandler);
        // Определяем обработчик один раз
        if (!quizzesQuestionsSubmitHandler) {
            quizzesQuestionsSubmitHandler = async (event) => {
                event.preventDefault();

                const formData = new FormData();
                formData.append('quiz', quizId);
                formData.append('question', document.getElementById('question').value);
                formData.append('image_quest', document.getElementById('image_quest').files[0]);
                console.log("Отправляемые данные FormData:");
                for (let pair of formData.entries()) {
                    console.log(`${pair[0]}: ${pair[1]}`);
                }
                try {
                    const response = await fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/questions/`, {
                        method: 'POST',
                        body: formData,
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` },
                    });

                    if (response.ok) {
                        const question = await response.json();
                        document.getElementById('createQuizzesQuestions-message').textContent =
                            'Вопрос успешно создан! Теперь добавьте варианты ответов.';
                        createQuizzesQuestionsForm.reset(); // Сброс формы
                        createQuizzesQuestionsForm.style.display = "none";
                        await createQuizzesQuestionsAnswers(quizId, question.id);
                        console.log("Question ID finish func:", question.id);
                    } else {
                        throw new Error('Ошибка при создании вопроса');
                    }
                } catch (error) {
                    document.getElementById('createQuizzesQuestions-message').textContent = error.message;
                }
            };
        }

        // Добавляем новый обработчик
        createQuizzesQuestionsForm.addEventListener('submit', quizzesQuestionsSubmitHandler);
    }

    let quizzesQuestionsAnswersSubmitHandler = null;

    async function createQuizzesQuestionsAnswers(quizId, questionId) {
        createQuizzesQuestionsAnswersForm.style.display = "block";
        document.getElementById('createQuizzesQuestionsAnswers-message').textContent = ''; // Сбрасываем сообщение
        console.log("Question ID:перед созданием массива ответов", questionId);

        // Удаляем предыдущие обработчики, если они существуют
        if (quizzesQuestionsAnswersSubmitHandler) {
            createQuizzesQuestionsAnswersForm.removeEventListener('submit', quizzesQuestionsAnswersSubmitHandler);
        }

        // Создаем массив для хранения ответов
        let answers = [];
        const currentQuestionId = questionId

        document.getElementById('append').onclick = (event) => {
            event.preventDefault();
            const answerValue = document.getElementById('answer').value.trim();
            const isCorrect = document.getElementById('is_correct').value === "true"; // Преобразуем в булевое значение
            if (answerValue) {
                answers.push({ answer: answerValue, is_correct: isCorrect}); // Добавляем ответ в массив
                console.log("Добавленный ответ:", { answer: answerValue, is_correct: isCorrect});
                document.getElementById('createQuizzesQuestionsAnswers-message').textContent =
                    'Ответ добавлен!';

                document.getElementById('answer').value = ''; // Очищаем только поле ответа
                // createQuizzesQuestionsAnswersForm.reset(); // Сброс формы
            } else {
                document.getElementById('createQuizzesQuestionsAnswers-message').textContent =
                    'Пожалуйста, введите ответ.';
            }
        };
        console.log("Question ID:перед вызовом функции confirmAnswersHandler перед кнопкой Подтвердить", questionId);
        document.getElementById('stop').onclick = async (event) => {
            event.preventDefault();
            await confirmAnswersHandler(currentQuestionId); // Передаем актуальный questionId
        };
        console.log("Question ID:перед самой функцией confirmAnswersHandler", questionId);
                // Обработчик для кнопки "Подтвердить форму ответов"
        async function confirmAnswersHandler (currentQuestionId) {
           console.log("Question ID:после переменной confirmAnswersHandler", currentQuestionId);

           if (answers.length === 0) {
               document.getElementById('createQuizzesQuestionsAnswers-message').textContent =
                   'Нет добавленных ответов для отправки.';
               return;
           }

           try {
               // Формируем JSON-данные для отправки
               console.log("Question ID:перед формированием data", currentQuestionId);
               const data = {
                   question: currentQuestionId,
                   answers: answers
               };
               console.log("Данные перед отправкой запроса:",data)
               const response = await fetch(
                   `http://127.0.0.1:8000/api/quiztitle/${quizId}/questions/${currentQuestionId}/answers/`,
                   {
                       method: 'POST',
                       body: JSON.stringify(data),
                       headers: {
                           'Content-Type': 'application/json',
                           'Authorization': `Bearer ${localStorage.getItem('access')}`
                       },
                   }
               );

               if (response.ok) {
                   document.getElementById('createQuizzesQuestionsAnswers-message').textContent =
                       'Ответы успешно добавлены!';
                   createQuizzesQuestionsAnswersForm.reset();
                   answers = [];
                   createQuizzesQuestionsAnswersForm.style.display = "none";
                   await submitAppendQuestion(quizId);
               } else {
                   throw new Error('Ошибка при добавлении ответов');
               }
           } catch (error) {
               document.getElementById('createQuizzesQuestionsAnswers-message').textContent = error.message;
           }
        }



    }




    async function submitAppendQuestion(quizId) {
        submitAppendQuestionForm.style.display = "block";

        // Удаляем старые обработчики и добавляем новые
        ['append-question', 'stop-question'].forEach((id) => {
            const button = document.getElementById(id);
            button.replaceWith(button.cloneNode(true));
            document.getElementById(id).addEventListener("click", (event) => {
                event.preventDefault();
                submitAppendQuestionForm.style.display = "none";
                if (id === "append-question") {
                    createQuizzesQuestions(quizId); // Добавить еще вопрос
                } else {
                    console.log("Else")
                    window.location.href = 'http://127.0.0.1:8080'; // Завершить
                }
            });
        });
    }
    async function startQuiz(quiz) {
        quizzesContainer.innerHTML = ''; // Очистка контейнера перед началом теста
        console.log(quiz);
        const response = await fetch(`http://localhost:8000/api/quiztitle/${quiz.id}/questions/`, {
            // headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
        });

        if (!response.ok) {
            console.error("Ошибка при загрузке вопросов");
            return;
        }

        const questions = await response.json();
        if (questions.length === 0) {
            quizzesContainer.innerHTML = '<p>В этом квизе пока нет вопросов.</p>';
            return;
        }

        let currentQuestionIndex = 0;
        let correctAnswers = 0;

        function showQuestion(index) {
            const questionData = questions[index];
            quizzesContainer.innerHTML = `
                <h2>${questionData.question}</h2>
                ${questionData.image_quest ? `<img src="${questionData.image_quest}" style="max-width: 300px;">` : ''}
                <div id="answers-container"></div>
                <p id="progress">${index + 1} из ${questions.length} вопросов</p>
                <button id="next-button" style="display:none;">Далее</button>
                <button id="back-main-menu-button" style="display:block;">Назад к списку квизов</button>
            `;
            document.getElementById('next-button')?.addEventListener('click', () => {
                currentQuestionIndex++;
                if (currentQuestionIndex < questions.length) {
                    console.log(currentQuestionIndex);
                    showQuestion(currentQuestionIndex);
                    console.log("Прав ответы между вопросами",correctAnswers);
                } else {
                    console.log("Прав ответы перед отпр в функцию",correctAnswers);
                    showResult(correctAnswers);
                }
            });
            document.getElementById('back-main-menu-button')?.addEventListener('click', async () => {
                const response = await fetch('http://localhost:8000/api/current_user/', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access')}`,
                    },
                });

                if (response.ok) {
                    quizzesContainer.innerHTML = ''; // Очистка контейнера перед началом теста
                    await loadQuizzes();
                } else {
                    quizzesContainer.innerHTML = ''; // Очистка контейнера перед началом теста
                    await loadAllQuizzes();
            //         messageElement.innerText = "Для доступа к функциям создания квизов, просим Вас пройти регистрацию и авторизацию!!" +
            // " С уважением, Администрация сайта.";
                }
            });
            loadAnswers(questionData.id, index);
        }

        async function loadAnswers(questionId, questionIndex) {
            const answersResponse = await fetch(`http://localhost:8000/api/quiztitle/${quiz.id}/questions/${questionId}/answers/`, {
            });

            if (!answersResponse.ok) {
                console.error("Ошибка при загрузке ответов");
                return;
            }

            const answers = await answersResponse.json();
            console.log(answers)
            const answersContainer = document.getElementById('answers-container');
            answers.forEach(answer => {
                const button = document.createElement('button');
                button.textContent = answer.answer;
                button.classList.add('answer-button');
                button.addEventListener('click', () => checkAnswer(answer.is_correct, button, questionIndex));
                console.log("Данные передаваемые для проверки:", answer.is_correct, button, questionIndex )
                answersContainer.appendChild(button);
            });
        }

        function checkAnswer(selectedAnswer, button, questionIndex) {
            fetch(`http://localhost:8000/api/quiztitle/${quiz.id}/questions/${questions[questionIndex].id}/answers/`, {
            })
            .then(response => response.json())
            .then(answers => {
                console.log("Ответы с сервера:", answers);
                // Находим правильный ответ в массиве answers
                const correctAnswerData = answers.find(answer => answer.is_correct === true);
                if (!correctAnswerData) {
                    console.error("Правильный ответ не найден в данных с сервера");
                    return;
                }
                const correctAnswer = correctAnswerData.is_correct; // Извлекаем текст правильного ответа
                if (selectedAnswer === correctAnswer) {
                    button.style.backgroundColor = 'green';
                    correctAnswers++;
                } else {
                    button.style.backgroundColor = 'red';
                    document.querySelectorAll('.answer-button').forEach(btn => {
                        if (btn.textContent === correctAnswer) {
                            btn.style.backgroundColor = 'green';
                        }
                    });
                }

                document.getElementById('next-button').style.display = 'block';
            });
        }



        function showResult(correctAnswers) {
            console.log("Прав ответы перед формулой", correctAnswers)
            let percentage = (correctAnswers / questions.length) * 100;
            let message = "";

            if (percentage < 50) message = "Тебе нужно лучше выучить эту тему.";
            else if (percentage < 75) message = "Ты неплохо знаешь тему.";
            else if (percentage < 90) message = "Прекрасно ориентируешься.";
            else message = "Красавчик!!!";

            quizzesContainer.innerHTML = `
                <h2>Результат: ${percentage.toFixed(2)}%</h2>
                <p>${message}</p>
                <button id="restart-button">Пройти заново</button>
                <button id="return-button">Вернуться к квизам</button>
                <h3>Оставьте ваши контактные данные для обратной связи:</h3>
                <select id="contact-method">
                    <option value="">Выберите способ связи</option>
                    <option value="email">Электронная почта</option>
                    <option value="phone">Телефон</option>
                </select>
                <div id="contact-form" style="display:none;">
                    <input type="text" id="contact-input" placeholder="Введите ваши данные" />
                    <button id="submit-contact">Отправить</button>
                </div>
            `;
            // Добавляю обработчик события для выбора способа связи
            document.getElementById('contact-method').addEventListener('change', function() {
                const method = this.value;
                const contactForm = document.getElementById('contact-form');
                contactForm.style.display = method ? 'block' : 'none';
                contactForm.querySelector('input').placeholder = method === 'email' ? 'Введите ваш e-mail' : 'Введите ваш телефон';
            });

            // Обработчик отправки контактных данных
            document.getElementById('submit-contact').addEventListener('click', async () => {
                const contactInfo = document.getElementById('contact-input').value;
                const method = document.getElementById('contact-method').value;
                const emailAuthor = quiz.author.email
                console.log("Data being sent: ", JSON.stringify({contactInfo, method, percentage, emailAuthor}));
                if (contactInfo && method) {
                    const response = await fetch('http://127.0.0.1:8000/api/contact/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({contactInfo, method, percentage, emailAuthor}),
                    });

                    if (response.ok) {
                        alert('Ваши контактные данные отправлены!');
                    } else {
                        alert('Ошибка при отправке данных.');
                    }
                } else {
                    alert('Пожалуйста, заполните все поля.');
                }
            });


            // Добавляю обработчики событий для кнопок
            document.getElementById('restart-button').addEventListener('click', () => {
                startQuiz(quiz); // Перезапуск теста
            });

            document.getElementById('return-button').addEventListener('click', () => {
                const isAuthenticated = localStorage.getItem('access');
                if (isAuthenticated) {
                    loadQuizzes();
                } else {
                    loadAllQuizzes();
                    quizzesContainer.innerHTML = '';
                }
            });

        }

        showQuestion(currentQuestionIndex);
    }

    async function editQuiz(quizId) {
        console.log("Функция editQuiz вызвана");
        if (!editQuizContainer) {
            console.error('Контейнер edit-quiz не найден');
            return;
        }
        // Контейнер для формы
        editQuizContainer.innerHTML = ''; // Очищаем контейнер
        editQuizContainer.style.display = 'block';
        quizzesContainer.style.display = 'block';
        quizzesContainer.style.height = 'auto';
        const form = document.createElement('form'); // Начинаю создавать форму динамически
        // Загружаем данные квиза
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке квиза');
            }

            const data = await response.json();
            console.log('Ответ fetch id quiz:', data);
            // Создаем форму
            form.id = 'edit-quiz-form';
            form.enctype = 'multipart/form-data';

            // Поле для name_quiz
            const nameQuizLabel = document.createElement('label');
            nameQuizLabel.textContent = 'Общее название квиза:';
            const nameQuizInput = document.createElement('input');
            nameQuizInput.type = 'text';
            nameQuizInput.id = 'name_quiz';
            nameQuizInput.value = data.name_quiz;
            form.appendChild(nameQuizLabel);
            form.appendChild(nameQuizInput);

            // Поле для title
            const titleLabel = document.createElement('label');
            titleLabel.textContent = 'Заглавие:';
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.id = 'title';
            titleInput.value = data.title;
            form.appendChild(titleLabel);
            form.appendChild(titleInput);

            // Поле для description
            const descriptionLabel = document.createElement('label');
            descriptionLabel.textContent = 'Описание:';
            const descriptionInput = document.createElement('textarea');
            descriptionInput.id = 'description';
            descriptionInput.value = data.description;
            form.appendChild(descriptionLabel);
            form.appendChild(descriptionInput);

            // Поле для image
            const imageLabel = document.createElement('label');
            imageLabel.textContent = 'Изображение:';
            const imageInput = document.createElement('input');
            imageInput.type = 'file';
            imageInput.id = 'image';
            imageInput.accept = 'image/*';
            form.appendChild(imageLabel);
            form.appendChild(imageInput);

            // Кнопка отправки
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Сохранить изменения';
            form.appendChild(submitButton);

            // Добавляем форму в контейнер
            form.style.display = 'block';
            editQuizContainer.appendChild(form);
            console.log("Форма добавлена в DOM:", form);
            quizzesContainer.appendChild(editQuizContainer);
            // Обработчик отправки формы
            form.addEventListener('submit', async function (event) {
                event.preventDefault(); // Блокировка отправки пустой формы

                // Собираем данные из формы
                const formEditData = new FormData();
                formEditData.append('name_quiz', nameQuizInput.value);
                formEditData.append('title', titleInput.value);
                formEditData.append('description', descriptionInput.value);

                // Добавляем файл только если он выбран
                const imageFile = imageInput.files[0];
                if (imageFile) {
                    formEditData.append('image', imageFile);
                }
                console.log("Sending data:");
                for (let [key, value] of formEditData.entries()) {
                    console.log(key, value);
                }
                console.log("Sending data:", Object.fromEntries(formEditData));

                try {
                    const responseEdit = await fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/`, {
                        method: 'PATCH',
                        body: formEditData,
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access')}`,
                        },
                    });

                    console.log("Response status: ", responseEdit.status); // Вывод статуса ответа

                    if (responseEdit.ok) {
                        const choiceEditQuestion = confirm('Данные квиза успешно изменены! Хотите редактировать вопросы квиза?');
                        if (choiceEditQuestion) {
                           await editQuestion(quizId);
                           form.style.display = 'none';
                        } else {
                            await loadQuizzes();
                            await loadAllQuizzes();
                        }
                    } else {
                        throw new Error('Ошибка при изменении данных');
                    }
                } catch (error) {
                    console.error("Ошибка при изменении данных квиза:", error.message);
                    alert('Ошибка при изменении данных.');
                }
            });
        } catch (error) {
            console.error('Ошибка при загрузке квиза:', error);
        }
    }

    async function editQuestion(quizId){
        quizzesContainer.innerHTML = '';
        const formEditQuestion = document.createElement('form'); // Начинаем создавать здесь форму для видимости
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/details/`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке квиза');
            }

            const dataQuestions = await response.json();
            console.log('Ответ fetch id quiz:', dataQuestions);
            dataQuestions.forEach(dataQuestion=>{
                formEditQuestion.id = 'edit-quizQuestion-form';
                formEditQuestion.enctype = 'multipart/form-data';
                formEditQuestion.dataset.questionId = dataQuestion.id;

                // Поле для question
                const nameQuestionLabel = document.createElement('label');
                nameQuestionLabel.textContent = 'Название вопроса квиза:';
                const nameQuestionInput = document.createElement('input');
                nameQuestionInput.type = 'text';
                nameQuestionInput.id = 'question';
                nameQuestionInput.name = 'question';
                nameQuestionInput.value = dataQuestion.question;
                formEditQuestion.appendChild(nameQuestionLabel);
                formEditQuestion.appendChild(nameQuestionInput);

                // Поле для image_quest
                const imageQuestionLabel = document.createElement('label');
                imageQuestionLabel.textContent = 'Изображение для вопроса:';
                const imageQuestionInput = document.createElement('input');
                imageQuestionInput.type = 'file';
                imageQuestionInput.id = 'image_quest';
                imageQuestionInput.name = 'image_quest';
                imageQuestionInput.accept = 'image/*';
                formEditQuestion.appendChild(imageQuestionLabel);
                formEditQuestion.appendChild(imageQuestionInput);
                editQuizContainer.appendChild(formEditQuestion);
                formEditQuestion.style.display = 'block';

                console.log("Структура формы:", formEditQuestion.innerHTML);
            })
            // Кнопка отправки
            const submitEditQuestionButton = document.createElement('button');
            submitEditQuestionButton.type = 'submit';
            submitEditQuestionButton.textContent = 'Сохранить изменения';
            editQuizContainer.appendChild(submitEditQuestionButton);
            console.log(1)

            // Обработчик отправки формы
            submitEditQuestionButton.addEventListener('click', async function (event) {
                event.preventDefault(); // Блокировка отправки формы

                // Собираем данные из всех форм
                const forms = document.querySelectorAll('#edit-quizQuestion-form');
                const updatePromises = []; // Массив для хранения промисов

                forms.forEach((form, index) => {
                    const formData = new FormData(form);
                    const questionId = form.dataset.questionId; // Получаем ID вопроса из data-атрибута

                    // Логирование данных формы
                    console.log(`Данные формы ${index + 1}:`);
                    for (let [key, value] of formData.entries()) {
                        console.log(key, value);
                    }

                    const updatePromise = fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/questions/${questionId}/`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access')}`,
                        },
                        body: formData, // Используем FormData для отправки файлов
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Ошибка при обновлении вопроса ${questionId}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log(`Вопрос ${questionId} успешно обновлен:`, data);
                    })
                    .catch(error => {
                        console.error(`Ошибка при обновлении вопроса ${questionId}:`, error.message);
                    });

                    updatePromises.push(updatePromise); // Добавляем промис в массив
                });

                // Ожидаем завершения всех запросов
                try {
                    await Promise.all(updatePromises); // Ждем, пока все запросы завершатся
                    alert('Все вопросы успешно обновлены!');

                    const choiceEditQuestionAnswer = confirm('Хотите редактировать ответы на вопросы?');
                    if (choiceEditQuestionAnswer) {
                        await editQuestionAnswer(quizId, dataQuestions); // Продолжаем редактирование
                        formEditQuestion.style.display = 'none';
                    } else {
                        await loadQuizzes();
                        await loadAllQuizzes();
                    }
                } catch (error) {
                    console.error("Ошибка при обновлении вопросов:", error.message);
                    alert('Ошибка при обновлении вопросов.');
                }
            });
            quizzesContainer.appendChild(editQuizContainer);
        } catch (error) {
            console.error('Ошибка при загрузке квиза:', error);
        }
    }

    async function editQuestionAnswer(quizId, questionsData) {
        quizzesContainer.innerHTML = '';
        console.log('Данные questionsData:',questionsData);
        try {
            // Собираем все ответы для всех вопросов
            const allAnswers = [];
            for (const questionData of questionsData) {
                const responseAnswers = await fetch(`http://localhost:8000/api/quiztitle/${quizId}/questions/${questionData.id}/answers/`, {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access')}`,
                    },
                });

                if (!responseAnswers.ok) {
                    throw new Error('Ошибка при загрузке ответов');
                }

                const dataAnswers = await responseAnswers.json();
                console.log('Квестьон дэйта', questionData.id);
                console.log('Ответы для вопроса:', questionData.id, dataAnswers);

                // Добавляем ответы в общий массив
                allAnswers.push({
                    questionId: questionData.id,
                    questionText: questionData.question,
                    answers: dataAnswers,
                });
            }

            // Отображаем формы для всех ответов
            allAnswers.forEach(({ questionId,questionText, answers }) => {
                const questionContainer = document.createElement('div');
                questionContainer.classList.add('question-container');

                // Добавляем заголовок с текстом вопроса
                const questionHeader = document.createElement('h3');
                questionHeader.textContent = `Вопрос: ${questionText}`;
                questionContainer.appendChild(questionHeader);

                answers.forEach(answer => {
                    console.log('Данные answer =', answer);
                    if (!formTemplate) {
                        console.error('Шаблон с id="edit-quizQuestionAnswer-form" не найден в DOM.');
                        return;
                    }
                    const formClone = formTemplate.content.cloneNode(true);

                    // Находим элементы в клонированной форме
                    const formEditAnswer = formClone.querySelector('form');
                    formEditAnswer.dataset.answerId = answer.id; // Добавляем ID ответа
                    formEditAnswer.dataset.questionId = questionId; // Добавляем ID вопроса
                    const nameAnswerInput = formClone.querySelector('input[name="answer"]');
                    const isCorrectSelect = formClone.querySelector('select[name="is_correct"]');

                    // Заполняем форму данными
                    nameAnswerInput.value = answer.answer;
                    isCorrectSelect.value = answer.is_correct ? 'true' : 'false';

                    // Добавляем форму в контейнер текущего вопроса
                    questionContainer.appendChild(formEditAnswer);
                    editQuizContainer.appendChild(questionContainer)
                });


            }); // Закрываем forEach
            // Кнопка отправки для текущего вопроса
            const submitEditAnswerButton = document.createElement('button');
            submitEditAnswerButton.type = 'button'; // Изменяем тип на "button"
            submitEditAnswerButton.textContent = 'Сохранить изменения';
            editQuizContainer.appendChild(submitEditAnswerButton);

            // Обработчик отправки формы для текущего вопроса
            submitEditAnswerButton.addEventListener('click', async function (event) {
                event.preventDefault(); // Блокировка отправки формы

                // Собираем данные из всех форм текущего вопроса
                const forms = editQuizContainer.querySelectorAll('.edit-answer-form');
                const updateAnswerPromises = []; // Массив для хранения промисов
                console.log('Данные перед foreach  - forms:', forms);

                forms.forEach((form, index) => {
                    console.log('Данные от form:', form);
                    const formAnswerData = new FormData(form);
                    const answerId = form.dataset.answerId; // Получаем ID ответа из data-атрибута
                    const questionId = form.dataset.questionId; // Получаем ID вопроса из data-атрибута

                    // Логирование данных формы
                    console.log(`Данные формы ${index + 1}:`);
                    for (let [key, value] of formAnswerData.entries()) {
                        console.log(key, value);
                    }

                    // Отправляем PATCH-запрос для каждого ответа
                    const updatePromise = fetch(`http://127.0.0.1:8000/api/quiztitle/${quizId}/questions/${questionId}/answers/${answerId}/`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('access')}`,
                        },
                        body: formAnswerData,
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Ошибка при обновлении ответа ${answerId}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log(`Ответ ${answerId} успешно обновлен:`, data);
                    })
                    .catch(error => {
                        console.error(`Ошибка при обновлении ответа ${answerId}:`, error.message);
                    });

                    updateAnswerPromises.push(updatePromise); // Добавляем промис в массив
                });

                // Ожидаем завершения всех запросов
                try {
                    await Promise.all(updateAnswerPromises); // Ждем, пока все запросы завершатся
                    alert('Все ответы успешно обновлены! Редактирование квиза завершено!!');
                    await loadQuizzes(); // Перезагружаем список квизов
                    await loadAllQuizzes();
                } catch (error) {
                    console.error("Ошибка при обновлении ответов:", error.message);
                    alert('Ошибка при обновлении ответов.');
                }
            });
            // Добавляем контейнер текущего вопроса в общий контейнер
            quizzesContainer.appendChild(editQuizContainer);
        } catch (error) {
            console.error('Ошибка при загрузке квиза:', error);
            alert('Ошибка при загрузке данных ответов.');
        }
    }

    async function getCurrentUser() {
        const accessToken = localStorage.getItem('access');
        console.log("Токен v getcurrentuser:", accessToken)
        const response = await fetch('http://localhost:8000/api/current_user/', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const user = await response.json();
            return user.username;
        } else {
            throw new Error('Ошибка при получении информации о пользователе');
        }
    }

    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'http://127.0.0.1:8080';
    });
});



