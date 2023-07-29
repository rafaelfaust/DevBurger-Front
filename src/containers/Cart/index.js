import React from 'react'

import CartLogo from '../../assets/bannerCart.png'
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
      <Dev href="https://rafaelfaust.com.br" target="_blank">
        {' '}
        &copy; All Rights Reserved. Designed by Rafael Faust{' '}
      </Dev>
    </Container>
  )
}
