// Tests run with qwacback's question-type catalogue, as the app does after
// the root layout has loaded it.
import { setCatalogue, type Catalogue } from '$lib/questionTypes';
import catalogue from '$lib/question-types.fixture.json';

setCatalogue(catalogue as Catalogue);
