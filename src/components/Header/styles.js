import styled from 'styled-components'

export const Container = styled.div`
  height: 72px;
  background: #ffffff;
  box-shadow: 2px 3px 5px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-around;
`

export const ContainerLeft = styled.div`
  display: flex;
  gap: 30px;
`

export const ContainerRight = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`

export const PageLink = styled.a`
  cursor: pointer;
  text-decoration: none;
  font-weight: ${props => (props.isActive ? 'bold' : '400')};
  font-size: 16px;
  line-height: 19px;
  color: ${props => (props.isActive ? '#efa216' : '#555555')};

  &:hover {
    color: #efa216;
    border-bottom: 1px solid #efa216;
  }

  &:active {
    color: #cc1717;
  }
`

export const ContainerText = styled.div`
  p {
    font-style: normal;
    font-weight: 300;
    font-size: 14px;
    line-height: 16px;
    color: #555555;
  }
`

export const Line = styled.div`
  height: 40px;
  border-right: 0.5px solid #bababa;
`
export const PageLinkExit = styled.a`
  font-weight: 700;
  font-size: 14px;
  line-height: 16px;
  color: #efa216;
  cursor: pointer;

  &:hover {
    border-bottom: 1px solid #efa216;
  }

  &:active {
    color: #cc1717;
  }
`
