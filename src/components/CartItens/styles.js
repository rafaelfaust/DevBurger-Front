import styled from 'styled-components'

export const Container = styled.div`
  background: #ffffff;
  box-shadow: 0px 10px 40px rgba(0, 0, 0, 0.03);
  border-radius: 20px;
  width: max-content;
  padding: 10px;
`

export const Header = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 10px;
  grid-gap: 10px 15px;
  border-bottom: 1px solid #9a9a9d;
  font-style: normal;
  font-weight: 400;
  font-size: 17px;
  line-height: 20px;
  color: #9a9a9d;
`

export const Body = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 10px;
  grid-gap: 10px 15px;
  width: max-content;
  align-items: center;

  p {
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 19px;
    color: #000000;
  }

  img {
    width: 120px;
    border-radius: 10px;
  }

  .quantity-container {
    display: flex;
    gap: 20px;

    button {
      height: 30px;
      background: transparent;
      border: none;
      font-size: 21px;
      font-style: normal;
      font-weight: 400;
      line-height: 19px;
      cursor: pointer;
    }

    p {
      margin-top: 5px;
    }
  }
`
export const EmptyCart = styled.p`
  padding: 20px;
  text-align: center;
  font-weight: bold;
`
