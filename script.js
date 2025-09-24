// получаем окно чата, поле для воода сообщения, кнопки отправки текста и геолокации
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const geolocationButton = document.getElementById("geolocation-button");

const wsUrl = "wss://echo.websocket.org/";
// const wsUrl = 'wss://echo-ws-service.herokuapp.com/'; вебсокет по ссылке из ТЗ не работает, поэтому используется другой
let websocket;

// функция для добавления сообщений в чат
function addMessage(text, type) {
  const messageElement = document.createElement("div");

  if (type === "geolocation") {
    // обработка геолокации: делим геолокацию на долготу и ширину, затем создаем ссылку и записываем туда данные, потом добавляем ссылку в див
    const parts = text.split(" ");
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        const link = document.createElement("a");
        link.href = `https://www.openstreetmap.org/?lat=${lat}&lon=${lon}&zoom=15&layers=M`;
        link.textContent = `Ваша геолокация: ${lat}, ${lon}`;
        link.classList.add("geolocation-link");
        link.target = "_blank";
        messageElement.appendChild(link);
      } else {
        messageElement.textContent = "Не удалось сформировать ссылку на карту.";
      }
    } else {
      messageElement.textContent = "Неверный формат геолокации.";
    }
    messageElement.classList.add("user-message");
  } else if (type === "user") {
    //здесь распределяем собщения на серверные и пользовательские для стилизации
    messageElement.textContent = text;
    messageElement.classList.add("user-message");
  } else {
    messageElement.textContent = text;
    messageElement.classList.add("server-message");
  }

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // автоматическая прокрутка вниз
}

// инициализация WebSocket соединения
function connectWebSocket() {
  websocket = new WebSocket(wsUrl);

  websocket.onopen = function (event) {
    console.log("WebSocket соединение установлено.");
    addMessage("Вы подключены к эхо-серверу.", "server");
  };

  websocket.onmessage = function (event) {
    //перед отправкой сообщения проверяем является ли оно координатами
    const messageData = event.data.trim();
    const coordinateRegex = /^-?\d+(\.\d+)? -?\d+(\.\d+)?$/;

    if (!coordinateRegex.test(messageData)) {
      // если сообщение не похоже на координаты, выводим как серверное
      addMessage(`Сервер: ${messageData}`, "server");
    }
  };

  websocket.onclose = function (event) {
    if (event.wasClean) {
      console.log(
        `Соединение закрыто, код=${event.code} причина=${event.reason}`
      );
      addMessage("Соединение с сервером закрыто.", "server");
    } else {
      console.error("Соединение прервано.");
      addMessage(
        "Соединение с сервером прервано. Попытка переподключения...",
        "server"
      );
    }
    setTimeout(connectWebSocket, 5000); // попытка переподключения через 5 секунд
  };

  websocket.onerror = function (error) {
    console.error("Ошибка WebSocket:", error);
    addMessage("Ошибка соединения с сервером.", "server");
  };
}

// отправка сообщения
sendButton.addEventListener("click", () => {
  const message = messageInput.value;
  //перед отправкой проверяем соединение с вебсокетом
  if (message && websocket && websocket.readyState === WebSocket.OPEN) {
    addMessage(`Вы: ${message}`, "user");
    websocket.send(message);
    messageInput.value = ""; // после отправки очищаем поле ввода
  } else if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    addMessage("Нет активного соединения с сервером.", "server");
  }
});

// отправка сообщения с помощью клавиши Enter
messageInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendButton.click();
  }
});

// отправка геолокации
geolocationButton.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const geolocationString = `${lat} ${lon}`; // формат для эхо-сервера

        // выводим в чат ссылку на OpenStreetMap как сообщение от пользователя
        addMessage(`${lat}, ${lon}`, "geolocation"); // тип 'geolocation' для стилизации

        if (websocket && websocket.readyState === WebSocket.OPEN) {
          websocket.send(geolocationString);
        } else {
          addMessage(
            "Нет активного соединения с сервером для отправки геолокации.",
            "server"
          );
        }
      },
      (error) => {
        let errorMessage = "Не удалось получить геолокацию. ";
        console.error(errorMessage, error);
        addMessage(errorMessage, "server");
      }
    );
  } else {
    addMessage("Ваш браузер не поддерживает геолокацию.", "server");
  }
});

// инициализация при загрузке страницы
connectWebSocket();
