const iframe = document.getElementById('drawio-iframe');
const editor = document.getElementById('editor');
const importBtn = document.getElementById('importBtn');

const initialCode = `sequenceDiagram
    autonumber
    actor User as Студент (Актер)
    participant Form as :ФормаРегистрации
    participant Ctrl as :КонтроллерРегистрации
    participant StudentEnt as :Студент
    participant Catalog as :КаталогКурсов
    participant Course as :ПредлагаемыйКурс
    participant Sched as :ГрафикКурсов

    Note over User, Sched: Начало процесса регистрации

    User->>Form: Начать регистрацию
    activate Form
    Form->>Ctrl: создатьГрафик()
    activate Ctrl
    
    Ctrl->>StudentEnt: аутентифицирован()
    activate StudentEnt
    StudentEnt-->>Ctrl: true
    deactivate StudentEnt
    
    Ctrl->>StudentEnt: getТекущийГрафик()
    activate StudentEnt
    StudentEnt-->>Ctrl: ГрафикКурсов
    deactivate StudentEnt
    
    Ctrl->>Catalog: getДоступныеКурсы()
    activate Catalog
    Catalog-->>Ctrl: List<ПредлагаемыйКурс>
    deactivate Catalog
    
    Ctrl-->>Form: готовность к выбору
    deactivate Ctrl
    Form->>Form: отобразитьМенюДействий()

    loop До завершения выбора
        User->>Form: выбратьОсновныеКурсы()
        Form->>Ctrl: добавитьКурсВГрафик(курс, студент)
        activate Ctrl
        
        Ctrl->>Catalog: найтиКурс(id)
        activate Catalog
        Catalog-->>Ctrl: Объект Курса
        deactivate Catalog
        
        Ctrl->>Course: естьМеста()
        activate Course
        Course-->>Ctrl: bool
        deactivate Course
        
        alt Есть свободные места
            Ctrl->>Course: записатьСтудента(студент)
            activate Course
            Course-->>Ctrl: успех
            deactivate Course
            Ctrl->>Sched: добавитьЗапись(запись)
            activate Sched
            Sched-->>Ctrl: записано
            deactivate Sched
        else Мест нет
            Note right of Ctrl: Вывод уведомления "Мест нет"
        end
        
        Ctrl-->>Form: статус операции
        deactivate Ctrl
    end

    User->>Form: Подтвердить и завершить
    Form->>Ctrl: сохранитьГрафик()
    activate Ctrl
    Ctrl->>Sched: зафиксировать()
    activate Sched
    Sched-->>Ctrl: подтверждено
    deactivate Sched
    Ctrl-->>Form: сохранено
    deactivate Ctrl
    
    Form->>Ctrl: закрытьРегистрацию()
    activate Ctrl
    Ctrl-->>Form: закрыто
    deactivate Ctrl
    
    Form->>Form: отобразитьГрафик()
    deactivate Form`;

editor.value = initialCode;

// Инициализируем iframe с параметрами embed.diagrams.net
const drawIoUrl = 'https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json';
iframe.setAttribute('src', drawIoUrl);

let drawioReady = false;

// Слушаем сообщения от iframe Draw.io
window.addEventListener('message', function(evt) {
    if (evt.origin !== 'https://embed.diagrams.net') {
        return;
    }

    try {
        const msg = JSON.parse(evt.data);

        if (msg.event === 'init') {
            drawioReady = true;
            console.log('Draw.io инициализирован');
            
            // Загружаем пустой холст при запуске
            iframe.contentWindow.postMessage(JSON.stringify({
                action: 'load',
                autosave: 1,
                xml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'
            }), '*');
        } 
    } catch (e) {
        console.error('Ошибка при обработке сообщения от Draw.io', e);
    }
});

// Отправка Mermaid кода в Draw.io для конвертации в графику
importBtn.addEventListener('click', () => {
    if (!drawioReady) {
        alert('Подождите, графический редактор еще загружается...');
        return;
    }
    
    const code = editor.value;
    
    // Draw.io API поддерживает загрузку через data URI (если он автоматически распознает) 
    // Либо можно передать как xml: code, так как Draw.io умеет парсить Mermaid если текст начинается с sequenceDiagram
    // Попробуем передать код напрямую в параметр load (или import). 
    
    // Используем правильный API Draw.io для загрузки не-XML форматов через descriptor
    iframe.contentWindow.postMessage(JSON.stringify({
        action: 'load',
        descriptor: {
            format: 'mermaid',
            data: code
        }
    }), '*');
});
