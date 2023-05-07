import React from 'react'

import HomeLogo from '../../assets/bannerProduct.svg'
import { CategoryCarousel, Header, OffersCarousel } from '../../components'
import { Container, HomeImg, Dev } from './styles'

export function Home() {
  return (
    <Container>
      <Header />
      <HomeImg src={HomeLogo} alt="logo da home" />
      <CategoryCarousel />
      <OffersCarousel />
      <Dev> &copy; All Rights Reserved. Designed by Rafael Faust </Dev>
    </Container>
  )
}
