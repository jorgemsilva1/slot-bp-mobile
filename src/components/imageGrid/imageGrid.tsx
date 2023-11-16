import styled from 'styled-components';

export const ImageGrid = () => {
    const images = [
        '/public/img/porto.png',
        '/public/img/benfica.png',
        '/public/img/sporting.png',
        '/public/img/braga.png',
    ];

    return (
        <Container>
            {images.map((img) => (
                <img src={img} alt={img.split('/public/img/')[0]} />
            ))}
        </Container>
    );
};

const Container = styled.figure`
    width: 80px;
    padding: 0;
    margin: 0;

    img {
        width: 100%;
        height: 80px;
        object-fit: contain;
        object-position: center;
    }
`;
