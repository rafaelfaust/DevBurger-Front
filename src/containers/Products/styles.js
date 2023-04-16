import styled from 'styled-components'

export const Container = styled.div``

export const ProductsImg = styled.img`
  width: 100%;
`
export const Menu = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  margin-top: 20px;
`

export const Btn = styled.button`
  font-style: normal;
  font-weight: 400;
  font-size: 17px;
  line-height: 20px;
  color: ${props => (props.isActiveCatagory ? '#efa216' : '#9a9a9d')};
  border: none;
  border-bottom: ${props => props.isActiveCatagory && '2px solid #efa216'};
  background: none;
  cursor: pointer;
  padding-bottom: 5px;
`
