/*
 * Клиентская реализация сокетоподобного интерфейса, поверх request интерфеса(то есть работает поверх script, xhr и тд)
 * Главная задача - реальновременное, двунаправленное взаимодействие, а значит используется long pooling
 * НЕ подразумевает: контроля целостности данных, дробление больших сообщений на запросы.
 */

/*
 * создаёт клиентский сокет
 * 
 * Сокет не гарантирует поддержания соединения и вообще ничего не гарантирует, кроме способности работать быстро.
 * @address адрес, с которым будет взаимодействие, это url
 */
function socket_cli_http(address){
    // привязывается нужная реализация request_cli интерфейса
    this.set_request_context = function(request_context){
	
    }
    this.send = function(data, callback){
    }

    this.on_data = function(data){
    }
}