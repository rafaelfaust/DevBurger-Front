import React, { useEffect, useState } from 'react'

import Logo from '../../assets/bannerProduct.svg'
import apiDevBurger from '../../services/api'
import { Container, ProductsImg, Btn, Menu } from './styles'

function Products() {
  const [categories, setCatagories] = useState([])
  const [activeCategory, setActiveCatagory] = useState(0)

  useEffect(() => {
    async function loadCategory() {
      const { data } = await apiDevBurger.get('categories')

      const newCategories = [{ id: 0, name: 'Todas' }, ...data]

      setCatagories(newCategories)
    }

    loadCategory()
  }, [])
  return (
    <Container>
      <ProductsImg src={Logo} alt="banner dos produtos" />
      <Menu>
        {categories &&
          categories.map(category => (
            <Btn
              isActiveCatagory={activeCategory === category.id}
              key={category.id}
              onClick={() => {
                setActiveCatagory(category.id)
              }}
            >
              {category.name}
            </Btn>
          ))}
      </Menu>
    </Container>
  )
}

export default Products
