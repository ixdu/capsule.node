/*
 * Название, хм. Ноги растут из таких понятий как state, stateless, stateful.
 * Понимать название концепта стоит как метатель|пробрасыватель|забасыватель состояния
 * Смысл в том, что у нас есть некоторая сущность, например функция, в ходе своей работы
 * она имеет состояние, то есть все используемые внутри неё переменные формируют его.
 * Когда из этой функции вызывается другая функция, этот вызов происходит из какого-то состояния.
 * Сам вызов также есть часть этого состояния. И это состояние передаётся вызванной функции.
 * По крайней мере буду предполагать так в рамках этой концепции.
 * 
 * К чему это имеет отношения, какие задачи решает:
 * + debug
 *   накопление информации для отладки. Знание где и при каких условиях что происходит, в том числе ошибки
 * + replacement of exceptions for distributed environment
 *   исключения вещь очень локальная, не говоря уже о невозможности хранить не только стек вызовов, а и 
 *   состояние всех взаимодействовавших частей. Так вот state_thrower знает обо всех 
 *   взаимодействиях и способен работать в распределённой системе вместе  с dsa и sequence.
 *  
 * + rollback, try again
 *   возможность повторить неудавшиеся операции, откатится на некоторое состояние, сделать иначе.
 *   Накопление состояний позволяет перемещаться между ними, хоть и не так просто:)
 * + statistic, relations of states, profiling 
 *   Накопление статистики состояний позволяет выводить взаимоотношения тех или иных сущностей. Близость
 *   их связей и делать выводы. Также это полезно для профилирование, так как становится известно в каком
 *   месте и сколько раз сделано то или иное действие
 * 
 * К реализации. По началу речь идёт о пробрасывании макросостояний - функция, минимальное описание её 
 * состояния и вызов другой функции. При этом делается это явно и далеко не для каждых функций. Естественно,
 * пробрасываются все вызовы сервисов, то есть на уровне dsa все состояния пробрасываются.
 * state_thrower также планируется для плотной интеграции с sequence, чтобы делать ничего вручную не приходилось
 */

var sthrower = require('parts/state_thrower.js');

function config_read(config_name){ 
    var config;
    try {
	config = JSON.parse(fs.readFileSync(config_name));	
    } catch (x) {
	sthrower.current.fail = x;
    }
    sthrower.current.success = 'config is created';
    return config;
}

function show_window(){
    var config = sthrower.call_and_push(config_read, 'config.json');
    sthrower.current.maximized = config.maximized;
    if(config.maximize)
	main.show('maximize');
    else 
	main.show('normal');
    sthrower.current.success = 'window is showed';
}

sthrower.call_and_push(show_window);
sthrower.call_and_push(show_window);
sthrower.call_and_push(show_window);
sthrower.call_and_push(show_window);

console.log(sthrower.tree);

/*
 * Особо тут пояснять нечего, sthrower используется как запускалка функций, чтобы создавать состояния
 * для каждой функции. Аналог стека вызовов, но с той разницей, что запоминается ВСЁ, все вызовы, в нашем
 * случае четыре show_window.
 * Затем дерево всех состояний распечатывается.
 *  
 */

sequence(sthrower,
	 ['s', id, 'generate_id'],
	 ['s', context.service, 'set', 'id', 'stack.last'])

sequence(sthrower,
	 ['s', id, 'generate_id'],
	 ['s', context.service, 'set', 'id', 'stack.last'])

sequence(['s',sthrower.service, 'collect_tree'],
	 ['fn', function(context, stack, sequence){
	      console.log(stack.last);
	  }]);

/*
 *А это уже интереснее, локальный sthrower не будет держать состояния, которые порадились в результате
 * работы двух цепочек, вызывающих сервис id. Но состояния будут хранится в контексте сервиса id.
 * Для того, чтобы собрать всё дерево воедино, нужно использовать sthrower как сервис, чтобы он вытащил
 * из контекста id состояния.
 * Такой механизм, наряду с возможностью передавать состояние на хранение другому и называется state thrower
 */

/*
 * Просто мысли, чтобы не забыть.
 * Для того, чтобы предсказуемо совершать действия, нужно чтобы порождаемые действия и действия, которые 
 * порождаются порождёнными действиями, выдавали предсказуемый результат. Один из следующих:
 * + не выдавали ничего, то есть как бы подвисло, исчезло
 * + выдан подходящий результат(скорее всего всё сработало как надо)
 * + выдан неподходящий результат(ошибка, исключение, сбой в обработке, мало ли чего)
 * Суть в том, что непдходящий результат, или изчезание может возникнуть в любом месте цепочке. Более того,
 * допустим мы послали сообщение объекту b, что-то сделать, а он перенаправил запрос объекту d. И всё вроде
 * хорошо, доподлинно известно, что запрос дошёл до d, но ответа нет. А тут вдруг и объект b исчез. А мы 
 * вероятно без b даже не можем узнать ничего о d. 
 * То есть в любой момент, в цепочке могут отказать множество звеньев и мы _должны_ что-то с этим сделать.
 * Если мы посылаем какой-то запрос кому-то, потом запрос идёт далее и далее. То поддерживая связь между
 * звеньями, и храня каждым звеном данные, которые оно приняло, возможно в любом месте цепи среагировать
 * и поступить альтернативным образом.
 * Пример:
 *
 * a -> b [сделать что-нибудь]
 * b -> a [hearth_beat] поддерживают связь, регулярно  
 * b -> c [сделай за меня первую часть]
 * c -> b [hearth_beat] поддерживает связь, регулярно  
 * b -> z [сделай за меня вторую часть]
 * z -> b [hearth_beat] поддерживает связь, регулярно  
 * 
 * z -> b [дело сделано]
 * c -> b [дело сделано]
 * b -> a [сделал что-нибудь] 
 * 
 * Всё как запланировано, окей
 * 
 * z -> b [дело не сделано]
 * c -> b [дело сделано]
 * b -> g [сделай за меня вторую часть
 * g -> b [hearth_beat] поддерживает связь, регулярно  
 * g -> b [дело сделано]
 * b -> a [сделал что-нибудь]
 * 
 * Не совсем как запланировано, но без особых сложностей
 * 
 * z | исчез, hearth_beat не посылает
 * b -> g [сделай за меня вторую часть]
 * c | исчез, hearth_beat не посылает
 * b -> t [сделай за меня первую часть]
 * g -> b [дело сделано]
 * t -> b [дело сделано]
 * b -> a [сделал что-нибудь]
 * 
 * Уже совсем не хорошо, но всё таки дело сделано
 * 
 * c -> b [дело сделано]
 * z -> b [дело сделано]
 * b | исчез, hearth_beat не посылает
 * 
 * a пытается найти найти другого исполнителя, но не находит,
 * a -> тому кто запрашивал [дело не сделано]
 * 
 * Всё это имеет прямое отношение к state_thrower, так как используется его информация состояний.
 * Но другое дело, что это уже вездесущий stack_trace, пригодный как для локальный вызовов асинхронных
 * операций, так и вызов сервисов. При этом, такой подход избавляет нас от необходимости гарантировать
 * доставку на уровне mq. Конечно, транспорты должны гарантировать целостностую и своевременную доставку
 * данных, но не более. mq же должен только доставить сообщение до адресата и раскланяться. Остальные 
 * гарантийные обязательства, а точнее попытки сделать дело, уже ложаться на сам рабочий код и механизм 
 * описанный выше и работащий втесном сотрудничестве с state_thrower.
 * 
 * Естественно, что уже сейчас ясно, что концепт state_thrower надо объединять с вышеописанным механизмом
 * и внедрять гораздо глубже.
 */