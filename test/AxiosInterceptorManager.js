class AxiosInterceptorManager {
  constructor(){
    this.interceptors = []
  }
  use(onFulfilled, onRejected){
    this.interceptors.push({
      onFulfilled,
      onRejected
    })
    return this.interceptors.length - 1
  }
  eject(id){
    if(this.interceptors[id]){
      this.interceptors[id] = null
    }
  }
}
module.exports = AxiosInterceptorManager