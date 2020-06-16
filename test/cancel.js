class Cancel {
  constructor(message){
    this.message = message
  }
}
function isCancel (error) {
  return error instanceof Cancel
}
class CacnelToken {
  constructor(){
    this.resolve = null
  }
  source(){
    return {
      token: new Promise((resolve) => {
        this.resolve = resolve
      }),
      cancel: (message) => {
        this.resolve(new Cancel(message))
      }
    }
  }
}
module.exports = {
  isCancel,
  CacnelToken
}