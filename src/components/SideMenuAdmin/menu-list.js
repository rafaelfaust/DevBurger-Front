import {
  faCartArrowDown,
  faCartPlus,
  faCartShopping
} from '@fortawesome/free-solid-svg-icons'

const listLinks = [
  {
    id: 1,
    label: 'Pedidos',
    link: '/pedidos',
    icon: faCartArrowDown
  },
  {
    id: 2,
    label: 'Produtos',
    link: '/pedidos',
    icon: faCartShopping
  },
  {
    id: 3,
    label: 'Adicionar Produto',
    link: '/pedidos',
    icon: faCartPlus
  }
]

export default listLinks
