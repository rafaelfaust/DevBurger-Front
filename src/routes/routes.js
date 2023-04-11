import React from 'react'
import {
  Switch,
  Route,
  BrowserRouter as Router
} from 'react-router-dom/cjs/react-router-dom.min'

import Home from '../containers/Home'
import Login from '../containers/Login'
import Register from '../containers/Register'
import PrivateRoute from './private-routes'

function Routes() {
  return (
    <Router>
      <Switch>
        <Route component={Login} path="/login" />
        <Route component={Register} path="/cadastro" />{' '}
        <PrivateRoute exact component={Home} path="/" />
      </Switch>
    </Router>
  )
}

export default Routes
