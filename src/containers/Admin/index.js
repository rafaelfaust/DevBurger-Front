import React from 'react'

import { SideMenuAdmin } from '../../components'
import ListProducts from './ListProdutcs'
import Orders from './Orders'
import { Container, ContainerItems } from './styles'

export function Admin() {
  return (
    <Container>
      <SideMenuAdmin />
      <ContainerItems>
        {/* <Orders /> */}
        <ListProducts />
      </ContainerItems>
    </Container>
  )
}
