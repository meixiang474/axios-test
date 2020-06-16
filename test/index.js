const Axios = require('./Axios')
const {isCancel, CancelToken} = require('./cancel')
function createInstance(){
  let context = new Axios()
  let instance = Axios.prototype.request.bind(context)
  instance = Object.assign(instance, Axios.prototype, context)
  return instance
}
let axios = createInstance()
axios.CancelToken = new CancelToken()
axios.isCancel = isCancel
module.exports = axios