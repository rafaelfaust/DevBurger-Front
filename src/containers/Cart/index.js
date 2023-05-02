import React from 'react'

import CartLogo from '../../assets/bannerProduct.svg'
import { CartItens, CartResume } from '../../components'
import { Container, CartImg, Wrapper, Dev } from './styles'

export function Cart() {
  return (
    <Container>
      <CartImg src={CartLogo} alt="logo da carrinho" />
      <Wrapper>
        <CartItens />
        <CartResume />
      </Wrapper>
      <Dev> &copy; All Rights Reserved. Designed by Rafael Faust </Dev>
    </Container>
  )
}
