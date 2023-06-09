import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`

export const HomeImg = styled.img`
  width: 100%;
`
export const Dev = styled.p`
  color: #efa216;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  cursor: pointer;
  text-align: center;
  margin-bottom: 20px;

  &:hover {
    color: #cc1717;
  }

  &:active {
    opacity: 0.6;
  }
`
