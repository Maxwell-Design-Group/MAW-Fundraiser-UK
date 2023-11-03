import { json } from "@shopify/remix-oxygen";

const gql = String.raw;

export async function action({request, context: {storefront}}) {

    const body = await request.json();
    console.log("store", storefront)
    const { note, tickets } = body;


    const checkoutMutation = storefront.mutate(CHECKOUT_MUTATION,
      {
        variables: {
          input: {
            lineItems: [{ variantId: "gid://shopify/ProductVariant/45782004531490", quantity: tickets }],
            note
          }
        },
      },
    );
  
    const mutation = await checkoutMutation;
    const { errors } = await checkoutMutation;

    if (errors) {
      return json({status: 'error', errors}, {status: 500});
    }

    return json({status: 'ok', mutation});
}

const CHECKOUT_MUTATION = gql`
    mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
            checkout {
                id
                webUrl
                note
            }
            checkoutUserErrors {
                field
                message
            }
        }
    }
`