import styled from 'styled-components';

export const Divider = ({ label }: { label: string }) => {
    return (
        <Wrapper>
            <p>{label}</p>
        </Wrapper>
    );
};

const Wrapper = styled.span`
    position: relative;
    width: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 8px 0;

    p {
        margin: 0;
        text-align: center;
        width: 60px;
        font-size: 12px;
    }

    &:before,
    &:after {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: calc((100% - 60px) * 0.5 - 8px);
        height: 1px;
        background: rgba(255, 255, 255, 0.2);
    }

    &:before {
        left: 0;
    }

    &:after {
        right: 0;
    }
`;
