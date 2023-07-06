import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

import listLinks from './menu-list'
import { Container, ItemContainer, ListLink } from './styles'

export function SideMenuAdmin() {
  return (
    <Container>
      <hr></hr>
      {listLinks.map(item => (
        <ItemContainer key={item.id}>
          <FontAwesomeIcon icon={item.icon} className="icon" />
          <ListLink to={item.link}>{item.label}</ListLink>
        </ItemContainer>
      ))}
      <hr></hr>
    </Container>
  )
}