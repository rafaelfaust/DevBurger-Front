import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

import { useUser } from '../../hooks/UserContext'
import listLinks from './menu-list'
import { Container, ItemContainer, ListLink } from './styles'

export function SideMenuAdmin() {
  const { logout } = useUser()
  return (
    <Container>
      <hr></hr>
      {listLinks.map(item => (
        <ItemContainer key={item.id} isActive={true}>
          <FontAwesomeIcon icon={item.icon} className="icon" />
          <ListLink to={item.link}>{item.label}</ListLink>
        </ItemContainer>
      ))}
      <hr></hr>
      <ItemContainer className="logout">
        <FontAwesomeIcon icon={faArrowRightFromBracket} className="icon" />
        <ListLink to="/login" onClick={logout}>
          Sair
        </ListLink>
      </ItemContainer>
    </Container>
  )
}
