import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

import { useCart } from '../../hooks/CartContext'
import api from '../../services/api'
import formatCurrency from '../../utils/formatCurrency'
import { Button } from '../Button'
import { Container, ContainerTop, ContainerBottom } from './styles'

export function CartResume() {
  const [finalPrice, setFinalPrice] = useState(0)
  const [deliveryTax] = useState(5)

  const { cartProducts } = useCart()

  useEffect(() => {
    const sumAllItems = cartProducts.reduce((acc, current) => {
      return current.price * current.quantity + acc
    }, 0)

    setFinalPrice(sumAllItems)
  }, [cartProducts])

  const submitOrder = async () => {
    const order = cartProducts.map(product => {
      return { id: product.id, quantity: product.quantity }
    })
    await toast.promise(api.post('orders', { products: order }), {
      pending: 'Pedido em criação...',
      success: 'Pedido criado com sucesso!',
      error: 'Não foi possível criar o pedido, tente novamente.'
    })
  }

  return (
    <div>
      <Container>
        <ContainerTop>
          <h2 className="title">Resumo do Pedido</h2>
          <p className="items">Itens</p>
          <p className="items-price">{formatCurrency(finalPrice)}</p>
          <p className="delivery-tax">Taxa de entrega</p>
          <p className="delivery-tax-price">{formatCurrency(deliveryTax)}</p>
        </ContainerTop>
        <ContainerBottom>
          <p className="total">Total</p>
          <p className="total-price">
            {formatCurrency(finalPrice + deliveryTax)}
          </p>
        </ContainerBottom>
      </Container>
      <Button style={{ width: '100%', marginTop: 30 }} onClick={submitOrder}>
        Finalizar Pedido
      </Button>
    </div>
  )
}
