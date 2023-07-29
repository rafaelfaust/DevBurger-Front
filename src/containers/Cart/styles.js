import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #e5e5e5;
  min-height: calc(100vh - 72px);
`

export const CartImg = styled.img`
  width: 100%;
`
export const Dev = styled.a`
  color: #efa216;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  cursor: pointer;
  text-align: center;
  margin-bottom: 20px;
  text-decoration: none;

  &:hover {
    color: #cc1717;
  }

  &:active {
    opacity: 0.6;
  }
`
export const Wrapper = styled.div`
  display: flex;
  justify-content: space-evenly;
  margin-top: 30px;
  padding-bottom: 30px;
`
