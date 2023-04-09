import styled from 'styled-components'

export const ContainerButton = styled.button`
  border-radius: 20px;
  width: 190px;
  height: 40px;
  border: none;
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  cursor: pointer;
  transition: 0.5s;
  color: #cc1717;
  background: #efa216;
  box-shadow: inset 0 0 0 50px #efa216;
  border: solid 1px #efa216;

  &:hover {
    color: #efa216;
    background: transparent;
    box-shadow: inset 0 0 0 0 #efa216;
    border-color: #efa216;
  }
  &:active {
    border: solid 1px #cc1717;
    color: #cc1717;
  }
`
