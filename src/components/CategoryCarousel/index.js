import React, { useEffect, useState } from 'react'
import Carousel from 'react-elastic-carousel'

import apiDevBurger from '../../services/api'
import { Container, H1, ContainerItems, Image, Button } from './styles'

export function CategoryCarousel() {
  const [categories, setCatagories] = useState([])
  useEffect(() => {
    async function loadCategory() {
      const { data } = await apiDevBurger.get('categories')

      setCatagories(data)
    }

    loadCategory()
  }, [])

  const breakPoints = [
    { width: 1, itemsToShow: 1 },
    { width: 400, itemsToShow: 2 },
    { width: 600, itemsToShow: 3 },
    { width: 900, itemsToShow: 4 },
    { width: 1300, itemsToShow: 5 }
  ]

  return (
    <Container>
      <H1>CATEGORIAS</H1>
      <Carousel
        itemsToShow={4}
        style={{ width: '90%' }}
        breakPoints={breakPoints}
      >
        {categories &&
          categories.map(category => (
            <ContainerItems key={category.id}>
              <Image src={category.url} alt="foto da categoria" />
              <Button
                to={{
                  pathname: '/produtos',
                  state: { categoryId: category.id }
                }}
              >
                {category.name}
              </Button>
            </ContainerItems>
          ))}
      </Carousel>
    </Container>
  )
}
