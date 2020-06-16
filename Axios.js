const AxiosInterceptorManager = require('./AxiosInterceptorManager')
const qs = require('qs')
const parseHeaders = require('parse-headers')

let defaults = {
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
let getStyleMethods = ['get', 'head', 'delete', 'options']
let postStyleMethods = ['post', 'put', 'patch']
getStyleMethods.forEach(method => {
  defaults.headers[method] = {}
})
postStyleMethods.forEach(method => {
  defaults.headers[method] = {
    'content-type': 'application/json'
  }
})
let allMethods = [...getStyleMethods, ...postStyleMethods]
class Axios {
  constructor(){
    this.interceptors = {
      request: new AxiosInterceptorManager(),
      response: new AxiosInterceptorManager()
    }
    this.defaults = defaults
  }
  request(config){
    let headers = {
      ...this.defaults.headers,
      ...config.headers
    }
    config = {
      ...this.defaults,
      ...config
    }
    config.headers = headers
    if(config.transformRequest && config.data){
      config.transformRequest(config.data, config.headers)
    }
    const chain = [
      {
        onFulFilled: this.dispatchRequest,
        onRejected: error => error
      }
    ]
    this.interceptors.request.interceptors.forEach(interceptor => {
      interceptor && chain.unshift(interceptor)
    })
    this.interceptors.response.interceptors.forEach(interceptor => {
      interceptor && chain.push(interceptor)
    })
    let promise = Promise.resolve(config)
    while(chain.length){
      const {onRejected, onRejected} = chain.shift()
      promise = promise.then(onFulFilled, onRejected)
    }
    return promise
  }
  dispatchRequest(config){
    return new Promise ((resolve, reject) => {
      let {method, url, params, data, headers, timeout} = config
      let request = new XMLHttpRequest()
      if(params){
        params = qs.stringify(params)
        url += (url.includes('?') ? '&' : '?') + params
      }
      request.open(method, url, true)
      request.responseType = 'json'
      request.onreadystatechange = function () {
        if(request.readyState === 4 && request.status !== 0){
          if(request.status >= 200 && request.status < 300){
            let response = {
              data: request.response ? request.response : request.responseText,
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
            reject(`Error: Request failed with status code ${request.status}`)
          }
        }
      }
      if(headers){
        for(let key in headers){
          if(key === 'common' || key === config.method){
            for(let key2 in headers[key]){
              request.setRequestHeader(key, headers[key][key2])
            }
          }else if(!allMethods.includes(key)){
            request.setRequestHeader(key, headers[key])
          }
        }
      }
      let body = null
      if(data){
        body = JSON.stringify(data)
      }
      request.onerror = function(){
        reject('net::ERR_INTERNET_DISCONNECTED')
      }
      request.timeout = timeout
      request.ontimeout = function(){
        reject(`Error: timeout of ${timeout}ms exceeded`)
      }
      if(config.cancelToken){
        config.cancelToken.then((message) => {
          request.abort()
          reject(message)
        })
      }
      request.send(body)
    })
  }
}
module.exports = Axios