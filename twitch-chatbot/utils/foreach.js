/**
forEach assíncrono
@param {Array} array
@param {Callback} callback
@returns {Promise}
*/
export default async function asyncForEach(array = [], callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}