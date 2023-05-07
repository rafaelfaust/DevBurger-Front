import {
  faCartShopping,
  faCoffee,
  faUser
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

import { Container } from './styles'

export function Header() {
  return (
    <Container>
      <a>
        <FontAwesomeIcon icon={faCartShopping} style={{ color: '#efa216' }} />
      </a>
      <a>
        <FontAwesomeIcon icon={faUser} style={{ color: '#efa216' }} />
      </a>
    </Container>
  )
}
