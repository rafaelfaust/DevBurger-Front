import React from 'react'
import {
  Switch,
  Route,
  BrowserRouter as Router
} from 'react-router-dom/cjs/react-router-dom.min'

import { Home, Login, Products, Register, Cart, Admin } from '../containers'
import PrivateRoute from './private-routes'

function Routes() {
  return (
    <Router>
      <Switch>
        <Route component={Login} path="/login" />
        <Route component={Register} path="/cadastro" />{' '}
        <PrivateRoute exact component={Home} path="/" />
        <PrivateRoute component={Products} path="/produtos" />
        <PrivateRoute component={Cart} path="/carrinho" />
        <PrivateRoute component={Admin} path="/pedidos" isAdmin />
        <PrivateRoute component={Admin} path="/lista-produtos" isAdmin />
      </Switch>
    </Router>
  )
}

export default Routes
