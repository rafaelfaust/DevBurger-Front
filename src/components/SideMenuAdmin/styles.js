import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const Container = styled.div`
  background: #3c3c3c;
  box-shadow: 0px 0px 14px rgba(0, 0, 0, 0.15);
  width: 300px;
  top: 0;
  left: 0;

  hr {
    margin: 50px 15px;
  }
`
export const ItemContainer = styled.div`
  display: flex;
  height: 50px;
  align-items: center;
  background: #565656;
  border-radius: 2px;
  margin: 8px 15px;
  padding: 8px;

  .icon {
    color: #ffffff;
    margin-right: 8px;
    font-size: 14px;
  }
`

export const ListLink = styled(Link)`
  color: #ffffff;
  text-decoration: none;
  font-size: 14px;
  font-style: normal;
  font-weight: normal;
  line-height: 19px;
`
