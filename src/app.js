const app = require('./server')

function main () {
    /***
     * Configuro el puerto en el que va escuchar el server
     */
    app.set('port', process.env.PORT || 5000)
    /**
     * Preparo o le asigno el puerto donde va escuchar el server
     */
    const puerto = app.get('port')

    app.listen(puerto, ()=>{
        console.log('Servidor escuchando en el puerto', puerto)
    })
}

/**
 * Ejecuto función
 */
main()