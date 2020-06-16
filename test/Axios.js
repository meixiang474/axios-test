const AxiosInterceptorManager = require('./AxiosInterceptorManager')
const qs = require('qs')
const parseHeaders = require('parse-headers')
const defaults = {
  method: 'get',
  timeout: 0,
  headers: {
    common: {
      accept: 'application/json'
    }
  },
  transformRequest(data, headers){

  }
  transformResponse(response){
    return response
  }
}
let getStyleMethods = ['get', 'delete', 'head', 'options']
let postStyleMethods = ['post', 'put', 'patch']
getStyleMethods.forEach(method => {
  defaults.headers[method] = {}
})
postStyleMethods.forEach(method => {
  defaults.headers[method] = {
    'content-type': 'application/json'
  }
})
let allMthods = [...getStyleMethods, ...postStyleMethods]
class Axios {
  constructor(){
    this.interceptors = {
      response: new AxiosInterceptorManager(),
      response: new AxiosInterceptorManager()
    }
    this.defaults = defaults
  }
  request(config){
    let headers = {
      ...this.defaults.headers
      ...config.headers,
    }
    config = {
      ...this.defaults,
      ...config
    }
    config.headers = headers
    if(config.transformRequest && data){
      config.transformRequest(config.data, headers)
    }
    const chain = [
      {
        onFulfilled: this.dispatchRequest,
        onRejected: error => error
      }
    ]
    this.interceptors.request.interceptors.forEach(interceptor => {
      interceptor && chain.unshift(interceptor)
    })
    this.interceptors.response.interceptors.forEach(interceptor => {
      interceptor && chain.push(interceptor)
    })
    const promise = Promise.resolve(config)
    while(chain.length > 0){
      let {onFulfilled, onRejected} = chain.shift()
      promise = promise.then(onFulfilled, onRejected)
    }
    return promise
  }
  dispatchRequest(config){
    return new Promise((resolve, reject) => {
      let {url, method, timeout, params, data, headers} = config
      const request = new XMLHttpRequest()
      if(params){
        params = qs.stringify(params)
        url += (url.includes('?') ? '&' : '?') + params
      }
      request.open(method, url)
      request.responseType = 'json'
      request.onreadystatechange = () => {
        if(request.readyState === 4 && request.status !== 0){
          if(request.status >= 200 && request.status < 300){
            let response = {
              data: request.response ? request.response : JSON.parse(request.responseText),
              status: request.status,
              statusText: request.statusText,
              headers: parseHeaders(request.getAllResponseHeaders()),
              config,
              request
            }
            if(config.transformResponse){
              response = config.transformResponse(response)
            }
            resolve(response)
          }else{
            reject(request.status)
          }
        }
      }
      if(headers){
        for(let key in headers){
          if(key === 'common' || key === method){
            for(let key2 in headers[key]){
              request.setRequestHeader(key2, headers[key][key2])
            }
          }else if(!allMthods.includes(key)){
            request.setRequestHeader(key, headers[key])
          }
        }
      }
      let body = null
      if(data){
        body = JSON.stringify(data)
      }
      request.timeout = timeout
      request.ontimeout = () => {
        reject(timeout)
      }
      request.onerror = () => {
        reject('没网')
      }
      if(config.cancelToken){
        config.cancelToken.then(message => {
          request.abort()
          reject(message)
        })
      }
      request.send(body)
    })
  }
}
module.exports = Axios