import React from 'react'

import CartLogo from '../../assets/bannerProduct.svg'
import { CartItens } from '../../components'
import { Container, CartImg, Dev } from './styles'

export function Cart() {
  return (
    <Container>
      <CartImg src={CartLogo} alt="logo da Carrinho" />
      <CartItens />
      <Dev> &copy; All Rights Reserved. Designed by Rafael Faust </Dev>
    </Container>
  )
}
