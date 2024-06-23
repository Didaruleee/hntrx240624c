import styled, { keyframes } from 'styled-components';

const placeHolderShimmer = keyframes`
  0% {
    background-position: -500px 0
  }
  100% {
    background-position: 500px 0
  }
`;

const loadingAsset = keyframes`
  0% {
    background-color: #ffffff;
  }
  50% {
    background-color: #eaeaea;
  }
  100% {
    background-color: #ffffff;
  }
`;

type CardProps = {
  hasMultiple: boolean;
};

export const Card = styled.article<CardProps>`
display: flex;
flex-direction: column;
width: 200px;
height: 250px;  /* Make the card square */
outline: none;
border-radius: 6px;
border: solid 1px #e6e6e6;
 box-sizing: border-box;
padding: 0;
position: relative;
transition: 0.3s;

 @media (max-width: 450px) {
    width: 180px;
height: 230px; 
border: solid 1px black;
}
 @media (max-width: 410px) {
    width: 160px;
height: 230px; 
border: solid 1px black;
}
   @media (max-width: 360px) {
    width: 140px;
height: 250px; 
border: solid 1px black;
  }
cursor: pointer;

  :hover {
    transform: scale(1.02);
  }

 

  ${({ hasMultiple }) =>
    hasMultiple &&
    `
    :before {
      display: block;
      content: '';
     
      width: 98.5%;
      position: absolute;
      top: 0px;
      
      border-bottom: solid 1px #e6e6e6;
   
    }

    :after {
      display: block;
      content: '';
      height: 100%;
      
      position: absolute;
      top: 0px;
      left: 2%;
      border-bottom: solid 1px #e6e6e6;
      border-radius: 6px;
    }
  `}
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
`;

export const Title = styled.h1`
font-size: 18px;
font-family: Futura;
line-height: 0.8;

margin: 0;
text-align: center;
justify-content:center;
left: 0;

width: 100%;
background: rgba(255, 255, 255, 0.8);
padding: 0px;
box-sizing: border-box;
border-radius: 0 0 16px 16px;
`;

export const Text = styled.span`
  font-size: 16px;
  line-height: 24px;
  color: #1a1a1a;
  text-align: left;
  max-width: 190px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CollectionNameButton = styled.button`
  display: flex;
  align-items: center;
  background-color: transparent;
  outline: none;
  border: none;
  z-index: 1;
  cursor: pointer;
`;

export const GreyText = styled(Text)`
  color: #808080;
  margin-bottom: 8px;
`;

export const Tag = styled.div`
  font-family: CircularStdBold;
  font-size: 10px;
  line-height: 16px;
  letter-spacing: 1px;
  position: absolute;
  bottom: 0;
  left: 0;
  margin: 16px;
  padding: 8px 16px;
  opacity: 0.6;
  border-radius: 4px;
  background-color: #1a1a1a;
  color: #ffffff;
`;

export const PlaceholderPrice = styled.div`
  height: 8px;
`;

export const ShimmerBlock = styled(PlaceholderPrice)`
  animation: ${placeHolderShimmer} 1s linear infinite;
  background: linear-gradient(to right, #eeeeee 8%, #e7e7e7 18%, #eeeeee 33%);
  background-size: 1000px 18px;
  width: 200px;
  height: 14px;
`;

export const PlaceholderAsset = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  animation: ${loadingAsset} 1s infinite;
`;
