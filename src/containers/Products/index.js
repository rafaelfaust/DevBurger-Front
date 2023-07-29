import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'

import Logo from '../../assets/bannerProduct.svg'
import { CardProduct } from '../../components'
import apiDevBurger from '../../services/api'
import formatCurrency from '../../utils/formatCurrency'
import {
  Container,
  ProductsImg,
  Btn,
  Menu,
  ProductsContainer,
  Dev
} from './styles'

export function Products({ location: { state } }) {
  let categoryId = 0
  if (state?.categoryId) {
    categoryId = state.categoryId
  }

  const [categories, setCatagories] = useState([])
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [activeCategory, setActiveCatagory] = useState(categoryId)

  useEffect(() => {
    async function loadCategory() {
      const { data } = await apiDevBurger.get('categories')

      const newCategories = [{ id: 0, name: 'Todas' }, ...data]

      setCatagories(newCategories)
    }

    async function loadProducts() {
      const { data: allProducts } = await apiDevBurger.get('products')

      const newProducts = allProducts.map(product => {
        return { ...product, formatedPrice: formatCurrency(product.price) }
      })

      setProducts(newProducts)
    }
    loadProducts()

    loadCategory()
  }, [])

  useEffect(() => {
    if (activeCategory === 0) {
      setFilteredProducts(products)
    } else {
      const newFilteredProducts = products.filter(
        product => product.category_id === activeCategory
      )

      setFilteredProducts(newFilteredProducts)
    }
  }, [activeCategory, products])

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
      <ProductsContainer>
        {filteredProducts &&
          filteredProducts.map(product => (
            <CardProduct key={product.id} product={product} />
          ))}
      </ProductsContainer>
      <Dev> &copy; All Rights Reserved. Designed by Rafael Faust </Dev>
    </Container>
  )
}

Products.propTypes = {
  location: PropTypes.object
}
