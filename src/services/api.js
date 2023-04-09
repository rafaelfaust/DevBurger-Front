import axios from 'axios'

const apiDevBurger = axios.create({
  baseURL: 'http://localhost:3000'
})

export default apiDevBurger
