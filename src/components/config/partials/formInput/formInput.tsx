import styled from 'styled-components';

export const FormInput = ({ label, input }: { label: string; input: any }) => {
    return (
        <Container data-el="form-input">
            <label>{label}</label>
            {input}
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    column-gap: 12px;

    label {
        font-size: 12px;
    }

    input {
        width: 140px;
    }

    select {
        width: 148px;
    }
`;
