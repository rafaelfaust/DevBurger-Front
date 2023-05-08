import styled from 'styled-components'

export const Container = styled.div`
  background: #e5e5e5;
  min-height: calc(100vh - 72px);
`

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
export const Dev = styled.p`
  color: #efa216;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  cursor: pointer;
  text-align: center;

  &:hover {
    color: #cc1717;
  }

  &:active {
    opacity: 0.6;
  }
`
export const ProductsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 10px;
  justify-items: center;
  margin-top: 20px;
`
