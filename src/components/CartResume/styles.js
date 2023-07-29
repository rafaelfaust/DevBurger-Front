import styled from 'styled-components'

export const Container = styled.div`
  background-color: #ffffff;
  padding: 24px;
  border-radius: 20px;
  box-shadow: 0px 10px 40px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

export const ContainerTop = styled.div`
  display: grid;
  grid-gap: 10px 50px;
  grid-template-areas:
    'title title'
    'items items-price'
    'delivery-tax delivery-tax-price';

  .title {
    grid-area: title;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 16px;
    color: #222222;
    margin-bottom: 16px;
  }

  .items {
    grid-area: items;
  }

  .items-price {
    grid-area: items-price;
  }

  .delivery-tax {
    grid-area: delivery-tax;
  }

  .delivery-tax-price {
    grid-area: delivery-tax-price;
  }

  p {
    font-style: normal;
    font-weight: 300;
    font-size: 14px;
    line-height: 16px;
    color: #222222;
  }
`

export const ContainerBottom = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 50px;
  font-style: normal;
  font-weight: 400;
  font-size: 24px;
  line-height: 28px;
  color: #000000;
`
